"""Knowledge store: Chroma collection with time-validity + approval metadata.

Chunk metadata (all values str/int/bool - Chroma does not accept None):
  doc_id, source, title, doc_type, version, page, section,
  valid_from_i, valid_to_i (YYYYMMDD ints; valid_to exclusive, 99991231 = open),
  supersedes, superseded_by, owner, approved, review_status, origin (document|interview),
  audience, ingested_at, expert, topic, tags, source_hint, reviewer, review_note, language (en|de)
  interview facts also: expert_role, updated_at, content_hash, delta_type, kb_verdict, kb_evidence_ids
"""
import hashlib
import logging
import re
import uuid
from datetime import datetime
from pathlib import Path

import chromadb

from . import chunking, config, registry, semantic, updates
from .embeddings import embed_texts
from .models import DocMeta, FactIn
from .validity import OPEN_END, citation, date_to_int, int_to_date, today_int, validity_status

logger = logging.getLogger(__name__)

SUPPORTED = {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".md", ".txt"}
registry.REGISTRY_PATH = config.DATA_DIR / "registry.json"


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def content_hash(answer: str) -> str:
    """sha256 of the normalised answer (lowercase, whitespace collapsed) - detects identical answers."""
    return hashlib.sha256(" ".join(answer.lower().split()).encode("utf-8")).hexdigest()


# -- chunking ----------------------------------------------------------
def _split_markdown(text: str) -> list[tuple[str, str]]:
    """Split on markdown headings. Returns [(section_title, body_including_heading)]."""
    sections: list[tuple[str, list[str]]] = []
    title, buf = "", []
    for line in text.splitlines():
        if re.match(r"^#{1,6}\s+\S", line):
            if buf:
                sections.append((title, buf))
            title, buf = line.lstrip("#").strip(), [line]
        else:
            buf.append(line)
    if buf:
        sections.append((title, buf))
    return [(t, "\n".join(b).strip()) for t, b in sections if "\n".join(b).strip()]


def chunk_file(path: Path) -> list[tuple[str, int, str]]:
    """-> [(text, page, section)] using the copied regulatory chunker where it applies."""
    suffix = path.suffix.lower()
    cs = config.CHUNK_SIZE
    out: list[tuple[str, int, str]] = []
    if suffix == ".pdf":
        for c in chunking._parse_pdf_hierarchical(path, "", cs):
            out.append((c.text, c.page, c.metadata.get("article_no") or c.metadata.get("title") or ""))
    elif suffix in (".docx", ".doc"):
        for c in chunking._parse_docx_hierarchical(path, "", cs):
            out.append((c.text, c.page, c.metadata.get("article_no") or c.metadata.get("title") or ""))
    elif suffix in (".xlsx", ".xls"):
        for c in chunking._parse_xlsx(path, ""):
            out.append((c.text, c.page, c.metadata.get("title") or ""))
    elif suffix == ".pptx":
        from pptx import Presentation
        prs = Presentation(str(path))
        for i, slide in enumerate(prs.slides, 1):
            texts = [sh.text_frame.text for sh in slide.shapes if sh.has_text_frame]
            if slide.has_notes_slide:
                notes = slide.notes_slide.notes_text_frame.text
                if notes and notes.strip():
                    texts.append("Speaker notes: " + notes)
            full = "\n".join(t for t in texts if t and t.strip())
            title = ""
            if slide.shapes.title is not None and slide.shapes.title.has_text_frame:
                title = slide.shapes.title.text_frame.text
            for piece in chunking._sliding_window_split(full, cs, cs // 5):
                out.append((piece, i, title))
    elif suffix in (".md", ".txt"):
        text = path.read_text(encoding="utf-8", errors="replace")
        for section_title, body in _split_markdown(text):
            for piece in chunking._sliding_window_split(body, cs, cs // 5):
                out.append((piece, 1, section_title))
    else:
        raise ValueError(f"unsupported file type: {suffix}")
    return [(t, p, s) for t, p, s in out if t and t.strip()]


# -- store -------------------------------------------------------------
class KnowledgeStore:
    def __init__(self) -> None:
        config.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=config.CHROMA_PATH)
        self.col = self._open()

    def _open(self):
        return self.client.get_or_create_collection(
            name=config.COLLECTION, metadata={"hnsw:space": "cosine"}
        )

    def count(self) -> int:
        return self.col.count()

    # -- documents -----------------------------------------------------
    def add_document(self, path: Path, meta: DocMeta) -> dict:
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(str(path))
        if path.suffix.lower() not in SUPPORTED:
            raise ValueError(f"unsupported file type {path.suffix}; supported: {sorted(SUPPORTED)}")
        doc_id = meta.doc_id or path.stem
        self.delete_document(doc_id)  # re-ingest replaces
        pieces = chunk_file(path)
        if not pieces:
            raise ValueError(f"no text extracted from {path.name}")
        vf = date_to_int(meta.valid_from)
        vt = date_to_int(meta.valid_to) or OPEN_END
        now = _now()
        # semantic layer: department + concept items (one LLM call per document; failure must not block ingestion)
        department, analysis = (meta.department or ""), None
        chunk_pairs = [(f"{doc_id}:{i}", t) for i, (t, _, _) in enumerate(pieces)]
        smeta = {"doc_id": doc_id, "title": meta.title, "owner": meta.owner, "version": meta.version,
                 "valid_from": meta.valid_from, "valid_from_i": vf, "valid_to_i": vt}
        try:
            from . import llm
            analysis = semantic.analyze_document(smeta, chunk_pairs, llm.structured)
            if not department:
                department = analysis.department
        except Exception as e:  # noqa: BLE001 - LLM or network failure
            logger.warning("semantic analysis failed for %s: %s", doc_id, e)
        if department not in semantic.department_keys():
            department = "other"
        ids, docs, metas = [], [], []
        for i, (text, page, section) in enumerate(pieces):
            ids.append(f"{doc_id}:{i}")
            docs.append(text)
            metas.append({
                "doc_id": doc_id, "source": path.name, "title": meta.title,
                "doc_type": meta.doc_type, "version": meta.version,
                "page": int(page or 0), "section": (section or "")[:200],
                "valid_from_i": vf, "valid_to_i": vt,
                "supersedes": meta.supersedes or "", "superseded_by": "",
                "owner": meta.owner, "approved": bool(meta.approved),
                "review_status": "approved" if meta.approved else "draft",
                "origin": "document", "audience": meta.audience, "ingested_at": now,
                "expert": "", "topic": "", "tags": "", "source_hint": "",
                "reviewer": "", "review_note": "", "department": department,
                "language": meta.language or "en",
            })
        embs = embed_texts(docs)
        for i in range(0, len(ids), 200):
            self.col.add(ids=ids[i:i + 200], documents=docs[i:i + 200],
                         metadatas=metas[i:i + 200], embeddings=embs[i:i + 200])
        superseded = self._apply_supersession(meta.supersedes, doc_id, vf) if meta.supersedes else None
        registry.mark_indexed(path, len(ids), meta.doc_type)
        concepts = []
        if analysis is not None:
            analysis.department = department
            concepts = [r["concept_key"] for r in semantic.record_document(smeta, chunk_pairs, analysis)]
        if meta.supersedes:
            semantic.update_supersession(meta.supersedes, vf, doc_id)
        return {"doc_id": doc_id, "source": path.name, "chunks": len(ids),
                "valid_from": meta.valid_from, "valid_to": meta.valid_to,
                "supersedes": meta.supersedes, "superseded_doc": superseded,
                "department": department, "department_reason": analysis.department_reason if analysis else "",
                "concepts": concepts}

    def _apply_supersession(self, old_doc_id: str, new_doc_id: str, new_vf: int) -> dict:
        """Close the validity window of the older version at the new version's start."""
        got = self.col.get(where={"doc_id": old_doc_id}, include=["metadatas"])
        if not got["ids"]:
            return {"old_doc_id": old_doc_id, "found": False}
        new_metas = []
        for m in got["metadatas"]:
            m = dict(m)
            m["superseded_by"] = new_doc_id
            if m["valid_to_i"] > new_vf:
                m["valid_to_i"] = new_vf
            new_metas.append(m)
        self.col.update(ids=got["ids"], metadatas=new_metas)
        return {"old_doc_id": old_doc_id, "found": True, "chunks_updated": len(got["ids"]),
                "valid_to_set": int_to_date(new_vf)}

    def delete_document(self, doc_id: str) -> int:
        got = self.col.get(where={"doc_id": doc_id})
        if got["ids"]:
            self.col.delete(ids=got["ids"])
            semantic.remove_document(doc_id)
        return len(got["ids"])

    def delete_fact(self, fact_id: str) -> list[str]:
        """Deleting a fact that superseded document passages reopens them (valid_to = open, superseded_by = '').
        Returns the ids of the reopened chunks."""
        got = self.col.get(ids=[fact_id], include=["metadatas"])
        if not got["ids"] or got["metadatas"][0].get("origin") != "interview":
            raise KeyError(fact_id)
        reopened = []
        for cid in [i for i in got["metadatas"][0].get("supersedes", "").split(",") if i]:
            old = self.col.get(ids=[cid], include=["metadatas"])
            if old["ids"] and old["metadatas"][0].get("superseded_by") == fact_id:
                m = dict(old["metadatas"][0])
                m.update({"valid_to_i": OPEN_END, "superseded_by": ""})
                self.col.update(ids=[cid], metadatas=[m])
                reopened.append(cid)
        self.col.delete(ids=[fact_id])
        semantic.remove_fact(fact_id)
        return reopened

    def list_documents(self) -> list[dict]:
        got = self.col.get(where={"origin": "document"}, include=["metadatas"])
        docs: dict[str, dict] = {}
        today = today_int()
        for m in got["metadatas"]:
            d = docs.setdefault(m["doc_id"], {
                "doc_id": m["doc_id"], "source": m["source"], "title": m["title"],
                "doc_type": m["doc_type"], "version": m["version"],
                "valid_from": int_to_date(m["valid_from_i"]), "valid_to": int_to_date(m["valid_to_i"]),
                "supersedes": m["supersedes"] or None, "superseded_by": m["superseded_by"] or None,
                "owner": m["owner"], "approved": m["approved"], "department": m.get("department", ""),
                "language": m.get("language", "en"),
                "status_today": validity_status(m["valid_from_i"], m["valid_to_i"], today),
                "chunks": 0,
            })
            d["chunks"] += 1
        return sorted(docs.values(), key=lambda d: d["valid_from"] or "")

    # -- interview facts -----------------------------------------------
    def add_fact(self, fact: FactIn, kb_check: dict | None = None, department: str = "") -> dict:
        """Store an interview fact as a draft. kb_check (optional) is the automatic check of the
        answer against the knowledge base: {verdict, explanation, evidence_ids}. A verdict of
        'contradicted' lands in review_status='needs_review' so the reviewer sees the conflict first."""
        fid = f"fact:{uuid.uuid4().hex[:10]}"
        kb_check = kb_check or {}
        kb_verdict = kb_check.get("verdict") or "unchecked"
        review_status = "needs_review" if kb_verdict == "contradicted" else "draft"
        interviewed = fact.interviewed_at or int_to_date(today_int())
        vf = date_to_int(fact.valid_from or interviewed)
        vt = date_to_int(fact.valid_to) or OPEN_END
        text = f"Topic: {fact.topic}\nQ: {fact.question}\nA: {fact.answer}"
        slug = re.sub(r"[^a-z0-9]+", "-", fact.expert.lower()).strip("-")
        now = _now()
        meta = {
            "doc_id": f"interview:{slug}",
            "source": f"interview:{fact.expert}", "title": f"Expert interview - {fact.expert}",
            "doc_type": "interview", "version": interviewed, "page": 0,
            "section": fact.topic[:200], "valid_from_i": vf, "valid_to_i": vt,
            "supersedes": "", "superseded_by": "", "owner": fact.expert,
            "approved": False, "review_status": review_status, "origin": "interview",
            "audience": "all", "ingested_at": now, "updated_at": now, "expert": fact.expert,
            "expert_role": fact.expert_role,
            "topic": fact.topic, "tags": ",".join(fact.tags), "source_hint": fact.source_hint,
            "reviewer": "", "review_note": "",
            "kb_verdict": kb_verdict, "kb_explanation": kb_check.get("explanation", ""),
            "kb_evidence_ids": ",".join(kb_check.get("evidence_ids", [])),
            "delta_type": updates.delta_type(kb_verdict), "content_hash": content_hash(fact.answer),
            "department": department or fact.department or "other",
            "language": fact.lang or "en",
        }
        self.col.add(ids=[fid], documents=[text], metadatas=[meta], embeddings=embed_texts([text]))
        return self._row(fid, text, meta)

    def find_duplicate(self, expert: str, content_hash: str) -> dict | None:
        """An interview fact by the same expert with the identical (normalised) answer, if any."""
        got = self.col.get(where={"$and": [{"origin": "interview"}, {"content_hash": content_hash}, {"expert": expert}]},
                           include=["metadatas", "documents"])
        if not got["ids"]:
            return None
        return self._row(got["ids"][0], got["documents"][0], got["metadatas"][0])

    def set_review(self, chunk_id: str, approved: bool, reviewer: str, note: str) -> dict:
        got = self.col.get(ids=[chunk_id], include=["metadatas", "documents"])
        if not got["ids"]:
            raise KeyError(chunk_id)
        m = dict(got["metadatas"][0])
        now = _now()
        m.update({"approved": approved, "review_status": "approved" if approved else "rejected",
                  "reviewer": reviewer, "review_note": note, "reviewed_at": now, "updated_at": now})
        self.col.update(ids=[chunk_id], metadatas=[m])
        return self._row(chunk_id, got["documents"][0], m)

    def supersede_with_fact(self, fact_id: str) -> list[str]:
        """The approved fact replaces the document passages it was checked against (its kb_evidence_ids):
        each currently valid document chunk among them gets valid_to = fact.valid_from - 1 day and
        superseded_by = fact_id. Only chunk metadata changes; the document file is not touched."""
        got = self.col.get(ids=[fact_id], include=["metadatas"])
        if not got["ids"]:
            raise KeyError(fact_id)
        fm = dict(got["metadatas"][0])
        today, closed = today_int(), []
        for cid in [i for i in fm.get("kb_evidence_ids", "").split(",") if i]:
            old = self.col.get(ids=[cid], include=["metadatas"])
            if not old["ids"]:
                continue
            m = dict(old["metadatas"][0])
            if m.get("origin") != "document" or m["valid_to_i"] < today:
                continue
            m["valid_to_i"] = max(fm["valid_from_i"], m["valid_from_i"])  # valid_to is exclusive, like _apply_supersession
            m["superseded_by"] = fact_id
            self.col.update(ids=[cid], metadatas=[m])
            closed.append(cid)
        fm.update({"supersedes": ",".join(closed), "delta_type": "UPDATE", "updated_at": _now()})
        self.col.update(ids=[fact_id], metadatas=[fm])
        return closed

    def list_facts(self, status: str | None = None) -> list[dict]:
        conds = [{"origin": "interview"}]
        if status:
            conds.append({"review_status": status})
        where = conds[0] if len(conds) == 1 else {"$and": conds}
        got = self.col.get(where=where, include=["metadatas", "documents"])
        rows = [self._row(i, d, m) for i, d, m in zip(got["ids"], got["documents"], got["metadatas"])]
        return sorted(rows, key=lambda r: r["ingested_at"])

    def get(self, chunk_id: str) -> dict | None:
        got = self.col.get(ids=[chunk_id], include=["metadatas", "documents"])
        if not got["ids"]:
            return None
        return self._row(chunk_id, got["documents"][0], got["metadatas"][0])

    # -- search --------------------------------------------------------
    def search(self, q: str, as_of: str | None = None, k: int = 8,
               include_historical: bool = True, include_unapproved: bool = False,
               origin: str | None = None, department: str | None = None, language: str | None = None) -> list[dict]:
        as_of_i = date_to_int(as_of) or today_int()
        total = self.col.count()
        if total == 0:
            return []
        conds = []
        if not include_unapproved:
            conds.append({"approved": True})
        if origin:
            conds.append({"origin": origin})
        if department:
            conds.append({"department": department})
        if language:
            conds.append({"language": language})
        where = None if not conds else (conds[0] if len(conds) == 1 else {"$and": conds})
        n = min(max(k * 4, 20), total)
        qe = embed_texts([q], kind="query")[0]
        kwargs = dict(query_embeddings=[qe], n_results=n, include=["documents", "metadatas", "distances"])
        if where:
            kwargs["where"] = where
        res = self.col.query(**kwargs)
        hits = []
        for cid, doc, m, dist in zip(res["ids"][0], res["documents"][0], res["metadatas"][0], res["distances"][0]):
            status = validity_status(m["valid_from_i"], m["valid_to_i"], as_of_i)
            if status != "current" and not include_historical:
                continue
            row = self._row(cid, doc, m, as_of_i)
            row["score"] = round(1.0 - float(dist), 4)
            hits.append(row)
        hits.sort(key=lambda h: -h["score"])
        current = [h for h in hits if h["validity_status"] == "current"]
        historical = [h for h in hits if h["validity_status"] != "current"]
        if not include_historical or not historical:
            return current[:k]
        # Reserve a few slots for superseded / expired versions so that "what applied before" is never
        # crowded out by the many current sources (the deck's time-validity question needs both).
        n_hist = min(len(historical), max(2, k // 3))
        return current[:k - n_hist] + historical[:n_hist]

    # -- helpers -------------------------------------------------------
    def _row(self, cid: str, text: str, m: dict, as_of_i: int | None = None) -> dict:
        as_of_i = as_of_i or today_int()
        return {
            "id": cid, "text": text,
            "doc_id": m["doc_id"], "source": m["source"], "title": m["title"],
            "doc_type": m["doc_type"], "version": m["version"], "page": m["page"],
            "section": m["section"], "origin": m["origin"],
            "valid_from": int_to_date(m["valid_from_i"]), "valid_to": int_to_date(m["valid_to_i"]),
            "validity_status": validity_status(m["valid_from_i"], m["valid_to_i"], as_of_i),
            "supersedes": m["supersedes"] or None, "superseded_by": m["superseded_by"] or None,
            "owner": m["owner"], "approved": m["approved"], "review_status": m["review_status"],
            "expert": m.get("expert", ""), "expert_role": m.get("expert_role", ""), "topic": m.get("topic", ""),
            "reviewer": m.get("reviewer", ""), "review_note": m.get("review_note", ""), "reviewed_at": m.get("reviewed_at", ""),
            "kb_verdict": m.get("kb_verdict", ""), "kb_explanation": m.get("kb_explanation", ""),
            "kb_evidence_ids": [i for i in m.get("kb_evidence_ids", "").split(",") if i],
            "delta_type": m.get("delta_type", ""), "updated_at": m.get("updated_at", ""),
            "department": m.get("department", ""), "concept_keys": [k for k in m.get("concept_keys", "").split(",") if k],
            "language": m.get("language", "en"),
            "ingested_at": m["ingested_at"], "citation": citation(m),
        }

    def reset(self) -> None:
        self.client.delete_collection(config.COLLECTION)
        self.col = self._open()
        registry.clear()
        semantic.reset()

    def set_concept_keys(self, chunk_id: str, keys: list[str]) -> None:
        got = self.col.get(ids=[chunk_id], include=["metadatas"])
        if got["ids"]:
            m = dict(got["metadatas"][0])
            m["concept_keys"] = ",".join(keys)
            self.col.update(ids=[chunk_id], metadatas=[m])
