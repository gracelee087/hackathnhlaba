"""Knowledge Base (RAG) service — FastAPI. Run from rag-service/:  python -m app.main"""
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse

from . import config, embeddings, llm, semantic, updates, video
from .models import CheckIn, DocMeta, FactIn, InterviewNextIn, LocalIngest
from .store import KnowledgeStore, content_hash
from .validity import int_to_date, today_int

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("rag-service")

app = FastAPI(title="Knowledge Base (RAG)", version="0.1.0",
              description="Time-aware knowledge base for the Knowledge Transfer challenge. "
                          "Input: documents + interview facts. Output: validity-flagged search, "
                          "statement checks and training export.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

store: KnowledgeStore | None = None


def _store() -> KnowledgeStore:
    global store
    if store is None:
        store = KnowledgeStore()
    return store


@app.on_event("startup")
def _startup() -> None:
    _store()
    logger.info("store ready: collection=%s chunks=%d model=%s",
                config.COLLECTION, _store().count(), config.CLAUDE_MODEL)


def _as_of(value: Optional[str]) -> str:
    return value or int_to_date(today_int())


# ── minimal review UI (single static page) ──────────────────────────
STATIC_DIR = Path(__file__).resolve().parent / "static"


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/ui")


@app.get("/ui", include_in_schema=False)
def review_ui():
    return FileResponse(STATIC_DIR / "review.html")


# ── health ──────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "embedding_backend": config.EMBEDDING_BACKEND,
            "embed_model": embeddings.describe(),
            "llm_backend": config.LLM_BACKEND, "llm_model": llm.describe(),
            "chunks": _store().count(), "today": _as_of(None)}


# ── documents ───────────────────────────────────────────────────────
@app.post("/ingest", summary="Upload a document (pdf/docx/pptx/xlsx/md/txt) with validity metadata")
async def ingest(file: UploadFile = File(...), title: str = Form(...), valid_from: str = Form(...),
                 doc_id: Optional[str] = Form(None), doc_type: str = Form("other"), version: str = Form(""),
                 valid_to: Optional[str] = Form(None), supersedes: Optional[str] = Form(None),
                 owner: str = Form("company"), approved: bool = Form(True), audience: str = Form("all"),
                 department: Optional[str] = Form(None), language: str = Form("en")):
    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest = config.UPLOAD_DIR / Path(file.filename).name
    dest.write_bytes(await file.read())
    meta = DocMeta(doc_id=doc_id or None, title=title, doc_type=doc_type, version=version,
                   valid_from=valid_from, valid_to=valid_to or None, supersedes=supersedes or None,
                   owner=owner, approved=approved, audience=audience, department=department or None,
                   language=(language or "en").lower()[:2])
    try:
        # blocking work (PDF parse, embeddings, LLM analysis) off the event loop so parallel ingests overlap
        return await run_in_threadpool(_store().add_document, dest, meta)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(400, str(e))


@app.post("/ingest/local", summary="Ingest a file already on this machine (demo / batch)")
def ingest_local(body: LocalIngest):
    try:
        return _store().add_document(Path(body.path), body.meta)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(400, str(e))


@app.get("/documents")
def documents():
    return {"documents": _store().list_documents()}


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    return {"doc_id": doc_id, "chunks_deleted": _store().delete_document(doc_id)}


# ── search ──────────────────────────────────────────────────────────
@app.get("/search", summary="Semantic search with time validity judged at as_of")
def search(q: str, as_of: Optional[str] = None, k: int = 8,
           include_historical: bool = True, include_unapproved: bool = False,
           origin: Optional[str] = Query(None, description="document | interview"),
           department: Optional[str] = Query(None, description="taxonomy key, e.g. hr; omitted = all departments"),
           language: Optional[str] = Query(None, description="en | de: only chunks written in that language; omitted = both (cross-lingual)")):
    department = semantic.resolve_department(department) if department else None
    hits = _store().search(q, as_of, k, include_historical, include_unapproved, origin, department, language)
    return {"query": q, "as_of": _as_of(as_of), "count": len(hits), "department": department, "language": language, "hits": hits}


# ── interview facts (Human in the loop) ─────────────────────────────
@app.post("/facts", summary="Interview Interface posts one captured fact (stored as draft, auto-checked against the KB)")
def add_fact(fact: FactIn):
    """The answer is checked against the knowledge base as of today before it is stored:
    kb_verdict = correct | plausible | possibly_outdated | contradicted | unsupported (| unchecked if the LLM failed).
    'contradicted' -> review_status 'needs_review'; everything else -> 'draft'. Nothing is approved automatically.
    'unsupported' means undocumented expert knowledge (a documentation gap worth capturing).
    Each fact also carries delta_type (NO_CHANGE | ADD | CONFLICT | SUPERSEDED | UNCLASSIFIED, UPDATE after a
    supersede approval). An identical answer by the same expert is not stored again (duplicate_of)."""
    as_of = _as_of(None)
    st = _store()
    # Delta Engine, step 0: the same expert already gave this exact answer -> nothing new, nothing stored
    dup = st.find_duplicate(fact.expert, content_hash(fact.answer))
    if dup is not None:
        dup.update({"duplicate_of": dup["id"], "delta_type": "NO_CHANGE",
                    "kb_check": {"verdict": dup["kb_verdict"], "explanation": "identical answer already captured",
                                 "evidence_ids": [], "as_of": as_of}})
        return dup
    # semantic layer: which department does this knowledge belong to, which concepts does it touch
    analysis = None
    department = semantic.resolve_department(fact.department) or ""
    try:
        analysis = semantic.analyze_fact(fact.expert, fact.topic, fact.question, fact.answer, llm.structured)
        if not department:
            department = analysis.department
    except Exception as e:  # noqa: BLE001
        logger.warning("fact semantic analysis failed: %s", e)
    if department not in semantic.department_keys():
        department = "other"
    # The check is scoped to the department first (HR answers are judged against HR documents); fall back to all.
    hits = st.search(fact.answer, as_of, 8, include_historical=True, department=department)
    if len(hits) < 3:
        hits = st.search(fact.answer, as_of, 8, include_historical=True)
    # The question gives the answer its context (e.g. "what do colleagues get wrong" answers describe a mistake).
    statement = f"Interview question: {fact.question}\nExpert answer (judge this): {fact.answer}"
    kb_check: dict = {"verdict": "unchecked", "explanation": "", "evidence_ids": [], "as_of": as_of}
    try:
        v = llm.check_statement(statement, as_of, hits, semantic.glossary_block(), fact.lang)
        kb_check.update({"verdict": v.verdict, "explanation": v.explanation,
                         "what_applies_today": v.what_applies_today, "evidence_ids": v.evidence_ids})
    except llm.LLMError as e:
        logger.warning("fact stored without KB check: %s", e)
        kb_check["explanation"] = f"check failed: {e}"[:300]
    row = st.add_fact(fact, kb_check, department)
    row["kb_check"] = kb_check
    row["approver"] = semantic.approver_for(department)
    if analysis is not None:
        analysis.department = department
        keys = sorted({r["concept_key"] for r in semantic.record_fact(row, analysis)})
        st.set_concept_keys(row["id"], keys)
        row["concept_keys"] = keys
        row["unknown_terms"] = analysis.unknown_terms
        row["department_confidence"] = analysis.department_confidence
    return row


@app.get("/facts")
def list_facts(status: Optional[str] = Query(None, description="draft | needs_review | approved | rejected")):
    return {"facts": _store().list_facts(status)}


@app.post("/facts/{fact_id}/approve")
def approve_fact(fact_id: str, reviewer: str = "expert", note: str = "",
                 resolution: str = Query("coexist", description="coexist | supersede")):
    """Approval also writes the fact back to the source data folder (database/_updates/): who said it,
    when, who approved it, and what kind of change it is (new_knowledge / correction / confirmation / historical / update).
    resolution=coexist (default): the fact is approved next to the documents it was checked against.
    resolution=supersede: the fact replaces the cited document passages (kb_evidence_ids): their validity is closed
    at the fact's valid_from and they carry superseded_by=fact_id; the fact gets delta_type UPDATE, change_type update.
    Only chunk metadata changes - the document file is untouched and the owner should issue a new version."""
    if resolution not in ("coexist", "supersede"):
        raise HTTPException(400, "resolution must be coexist or supersede")
    st = _store()
    try:
        row = st.set_review(fact_id, True, reviewer, note)
    except KeyError:
        raise HTTPException(404, f"unknown fact id {fact_id}")
    semantic.set_fact_status(fact_id, "approved", reviewer)
    related = sorted({(st.get(i) or {}).get("doc_id", "") for i in row.get("kb_evidence_ids", [])} - {""})
    superseded: list[str] = []
    if resolution == "supersede":
        superseded = st.supersede_with_fact(fact_id)
        row = st.get(fact_id) or row
    row["superseded_chunks"] = superseded
    try:
        row["source_update"] = updates.record_approval(row, related)
    except OSError as e:
        logger.warning("approved but source update not written: %s", e)
        row["source_update"] = None
    return row


@app.get("/updates", summary="Approved interview knowledge written back to the source data (database/_updates/ledger.csv)")
def list_updates():
    return {"updates": updates.list_updates()}


@app.post("/facts/{fact_id}/reject")
def reject_fact(fact_id: str, reviewer: str = "expert", note: str = ""):
    try:
        row = _store().set_review(fact_id, False, reviewer, note)
    except KeyError:
        raise HTTPException(404, f"unknown fact id {fact_id}")
    semantic.set_fact_status(fact_id, "rejected", reviewer)
    return row


@app.delete("/facts/{fact_id}", summary="Delete one interview fact (duplicates, test entries)")
def delete_fact(fact_id: str):
    """If the fact had superseded document passages (resolution=supersede), those are reopened."""
    try:
        reopened = _store().delete_fact(fact_id)
    except KeyError:
        raise HTTPException(404, f"unknown fact id {fact_id}")
    return {"deleted": fact_id, "reopened_chunks": reopened}


# ── semantic layer (departments + concepts over the chunks) ─────────
@app.get("/taxonomy", summary="Departments the semantic layer classifies into, with the approver per department")
def get_taxonomy():
    return semantic.taxonomy()


@app.get("/semantic", summary="Concept cards: per concept the value timeline across document versions and the expert statements")
def get_semantic(department: Optional[str] = None, as_of: Optional[str] = None, expert: Optional[str] = None):
    cs = semantic.concepts(department, _as_of(as_of), expert)
    return {"as_of": _as_of(as_of), "department": department, "summary": semantic.summary(department), "concepts": cs}


@app.get("/semantic/unknown-terms", summary="Terms experts used that the glossary does not explain (interviewer asks to clarify)")
def get_unknown_terms(expert: Optional[str] = None):
    return {"unknown_terms": semantic.unknown_terms(expert)}


@app.get("/semantic/{concept_key}")
def get_concept(concept_key: str, as_of: Optional[str] = None):
    c = semantic.concept(concept_key, _as_of(as_of))
    if not c:
        raise HTTPException(404, f"unknown concept {concept_key}")
    return c


# ── AI interviewer (next question grounded in the knowledge base) ──
@app.post("/interview/next", summary="Propose the next interview question from the KB and the conversation so far")
def interview_next(body: InterviewNextIn):
    """Retrieves the topic (documents, current + historical) and, if there is a last answer, the evidence around it,
    plus this expert's facts already captured, then asks the LLM for ONE next question with a reason:
    opening | gap | contradiction | deepen | handover | closing."""
    as_of = _as_of(body.as_of)
    st = _store()
    dep = semantic.resolve_department(body.department) if body.department else None
    hits = st.search(body.topic, as_of, body.k, include_historical=True, include_unapproved=True, department=dep)
    if body.turns:
        last = body.turns[-1]
        extra = st.search(f"{last.question} {last.answer}", as_of, 6, include_historical=True, include_unapproved=True, department=dep)
        seen = {h["id"] for h in hits}
        hits += [h for h in extra if h["id"] not in seen]
    uncovered = semantic.uncovered_for(body.expert, dep)
    unknown = list(body.turns[-1].unknown_terms) if body.turns and body.turns[-1].unknown_terms else []
    try:
        nq = llm.next_question(body.expert, body.topic, [t.model_dump() for t in body.turns], as_of, hits, uncovered,
                               unknown, semantic.glossary_block(), body.lang)
    except llm.LLMError as e:
        raise HTTPException(502, str(e))
    by_id = {h["id"]: h for h in hits}
    return {"expert": body.expert, "topic": body.topic, "as_of": as_of, "lang": llm.lang_key(body.lang), "turn": len(body.turns) + 1,
            "question": nq.question, "reason": nq.reason, "rationale": nq.rationale,
            "evidence": [by_id[i] for i in nq.evidence_ids if i in by_id],
            "covered_topics": nq.covered_topics, "remaining_topics": nq.remaining_topics,
            "department": dep, "uncovered_concepts": uncovered}


# ── statement check (deck p.8: plausible / correct / possibly outdated) ──
@app.post("/check", summary="Is this statement correct, plausible or possibly outdated as of a date?")
def check(body: CheckIn):
    as_of = _as_of(body.as_of)
    dep = semantic.resolve_department(body.department) if body.department else None
    hits = _store().search(body.statement, as_of, body.k, include_historical=True, department=dep)
    try:
        verdict = llm.check_statement(body.statement, as_of, hits, semantic.glossary_block(), body.lang)
    except llm.LLMError as e:
        raise HTTPException(502, str(e))
    by_id = {h["id"]: h for h in hits}
    return {"statement": body.statement, "as_of": as_of, "verdict": verdict.verdict,
            "explanation": verdict.explanation, "what_applies_today": verdict.what_applies_today,
            "evidence": [by_id[i] for i in verdict.evidence_ids if i in by_id],
            "retrieved": hits}


# ── export for the Media Interface ──────────────────────────────────
@app.get("/export", summary="Structured knowledge package for training generation")
def export(topic: str, as_of: Optional[str] = None, audience: str = "beginner",
           k: int = 12, outline: bool = False, department: Optional[str] = None,
           lang: str = Query("en", description="en | de - language of the outline and speaker scripts")):
    as_of = _as_of(as_of)
    department = semantic.resolve_department(department) if department else None
    hits = _store().search(topic, as_of, k, include_historical=True, department=department)
    package = {
        "topic": topic, "as_of": as_of, "audience": audience, "lang": llm.lang_key(lang),
        "current": [h for h in hits if h["validity_status"] == "current"],
        "historical": [h for h in hits if h["validity_status"] != "current"],
        "sources": sorted({h["citation"] for h in hits}),
        "note": "Only approved knowledge is included. 'historical' items are superseded as of as_of "
                "and must not be taught as current.",
    }
    if outline:
        try:
            package["outline"] = llm.training_outline(topic, audience, as_of, hits, lang).model_dump()
        except llm.LLMError as e:
            raise HTTPException(502, str(e))
    return package


@app.post("/export/video", summary="Generate a short training video (German narration, customer look) from the export outline")
def export_video(topic: str, as_of: Optional[str] = None, audience: str = "beginner", k: int = 12,
                 department: Optional[str] = None, lang: str = "de",
                 style: str = Query("still", description="still = one image per scene (fast) | motion = HyperFrames motion graphics (~2x realtime render)")):
    if style not in ("still", "motion"):
        raise HTTPException(400, "style must be 'still' or 'motion'")
    package = export(topic, as_of, audience, k, True, department, lang)
    try:
        return video.build(topic, package["as_of"], audience, package["outline"], lang, style)
    except video.VideoError as e:
        raise HTTPException(500, str(e))


@app.get("/videos/{job}/{name}", include_in_schema=False)
def get_video(job: str, name: str):
    try:
        return FileResponse(video.video_path(f"{job}/{name}"), media_type="video/mp4")
    except FileNotFoundError:
        raise HTTPException(404, "video not found")


# ── admin ───────────────────────────────────────────────────────────
@app.post("/admin/reset", summary="Delete everything (demo use)")
def reset():
    _store().reset()
    return {"status": "reset", "chunks": _store().count()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=config.PORT, reload=False)
