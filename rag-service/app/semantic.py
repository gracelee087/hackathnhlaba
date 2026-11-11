"""Semantic layer: departments + concepts on top of the text chunks.

Layer 1 - department: every document and every interview fact is classified into one department of
           database/taxonomy.json (LLM, one call per document / per fact). Search, interview and export
           can be scoped to a department; the taxonomy names the approver per department.
Layer 2 - concepts: the same LLM call extracts the atomic knowledge items of a document (rules, deadlines,
           thresholds, procedure steps, contacts, forms) with a canonical concept_key such as
           compliance.dg.certified_driver_threshold. Interview answers are mapped to the same keys.
Layer 3 - links: every item remembers its chunk / document version / fact, so a concept can show its
           timeline (value per version with validity window) and the expert statements about it.

Storage: data/semantic.json (one JSON file next to the Chroma store). No graph database.
"""
import json
import logging
import threading
from typing import Optional

from pydantic import BaseModel, Field

from . import config
from .validity import int_to_date, today_int, validity_status

logger = logging.getLogger(__name__)

TAXONOMY_PATH = config.ROOT.parent / "database" / "taxonomy.json"
SEMANTIC_PATH = config.DATA_DIR / "semantic.json"
_lock = threading.Lock()


# -- taxonomy ------------------------------------------------------------
def taxonomy() -> dict:
    try:
        return json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    except OSError:
        return {"departments": [{"key": "other", "name": "Other", "approver": "", "description": ""}], "concept_kinds": []}


def department_keys() -> list[str]:
    return [d["key"] for d in taxonomy()["departments"]]


def approver_for(department: str) -> str:
    return next((d.get("approver", "") for d in taxonomy()["departments"] if d["key"] == department), "")


def resolve_department(text: Optional[str]) -> Optional[str]:
    """Map a department name, alias or key ('HR', 'Human Resources', 'Personalabteilung') to the taxonomy key."""
    if not text:
        return None
    s = text.strip().lower()
    for d in taxonomy()["departments"]:
        if s == d["key"] or s == d["name"].lower() or s in {a.lower() for a in d.get("aliases", [])}:
            return d["key"]
    return None


def glossary_block() -> str:
    g = taxonomy().get("glossary", [])
    if not g:
        return ""
    return "GLOSSARY (company terms and their aliases):\n" + "\n".join(
        f"- {x['term']} (also: {', '.join(x.get('aliases', []))}): {x['definition']}" for x in g)


def _taxonomy_block() -> str:
    t = taxonomy()
    deps = "\n".join(f"- {d['key']}: {d['name']} (also called: {', '.join(d.get('aliases', [])) or '-'}) - {d['description']}"
                     for d in t["departments"])
    return (f"DEPARTMENTS (choose exactly one key; aliases and translations map to the same key):\n{deps}\n\n"
            f"{glossary_block()}\n\nCONCEPT KINDS: {', '.join(t.get('concept_kinds', []))}")


# -- structured outputs --------------------------------------------------
class ConceptItem(BaseModel):
    chunk_index: int = Field(..., description="index of the chunk the item was read from (0-based); -1 for an interview answer")
    concept_key: str = Field(..., description="canonical key: <department>.<topic>.<attribute>, lower snake_case, e.g. compliance.dg.certified_driver_threshold")
    kind: str = Field(..., description="rule | deadline | threshold | procedure_step | contact | form | definition")
    statement: str = Field(..., description="one sentence stating the item as the source states it")
    value: str = Field("", description="the number, duration, name or form id if the item has one, else empty")
    unit: str = Field("", description="unit of the value (ADR points, hours, weeks, EUR, years...), else empty")
    condition: str = Field("", description="when / to whom the item applies, else empty")


class DocAnalysis(BaseModel):
    department: str
    department_reason: str
    items: list[ConceptItem]


class FactAnalysis(BaseModel):
    department: str
    department_reason: str
    department_confidence: str = Field("high", description="high | low - low when the answer could belong to several departments or to none")
    unknown_terms: list[str] = Field(default_factory=list, description="abbreviations, system names, forms or jargon in the answer that neither the glossary nor the known keys explain")
    items: list[ConceptItem]


ANALYZE_SYSTEM = """You build the semantic layer of a company knowledge base.
Given a document (title, owner, chunks with indexes) you return:
1. department: the one department key of the taxonomy the document belongs to. Use the owner and the content.
2. items: the atomic knowledge items the document states - rules, deadlines, thresholds, procedure steps, contacts, forms, definitions.
   One item per distinct fact. Skip disclaimers, scope sentences and repetitions. Keep statements short and faithful.
   concept_key is the identity of a fact ACROSS document versions: the same rule in version 1 and version 2 MUST get the
   same concept_key even if the value differs. Format <department>.<topic>.<attribute>, lower snake_case, no version numbers,
   no values in the key. If a KNOWN KEY already names the same concept, REUSE IT EXACTLY. Only invent a new key for a new concept.
   Typical attributes: ..._threshold, ..._deadline, ..._retention_years, ..._approval_channel, ..._max_hours, ..._cap_eur.
Documents may be written in English or German. concept_key and statement are ALWAYS in English: a German document and its
English counterpart (same title, same version) must produce the same concept_keys and the same values."""

FACT_SYSTEM = """You build the semantic layer of a company knowledge base.
Given one interview answer (expert, topic, question, answer) you return:
1. department: the one department key of the taxonomy this knowledge belongs to.
2. items: the atomic knowledge items the ANSWER states, mapped to concept keys. If a KNOWN KEY names the same concept the
   expert talks about (even with a different or outdated value), REUSE IT EXACTLY - that link is what makes outdated beliefs
   visible. Only invent a new key (format <department>.<topic>.<attribute>, lower snake_case) for knowledge no known key covers.
   Use chunk_index -1 for every item. Return no items if the answer states no checkable knowledge (e.g. "I think we covered it").
3. unknown_terms: every abbreviation, system, form or jargon word in the answer that the glossary and the known keys do not explain.
   Never guess what such a term means; list it so the interviewer can ask the expert. department_confidence: low if unsure.
The answer may be in English or German; concept keys and statements are always in English."""


# -- registry (data/semantic.json) ---------------------------------------
def _load() -> dict:
    try:
        return json.loads(SEMANTIC_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"items": []}


def _save(reg: dict) -> None:
    SEMANTIC_PATH.parent.mkdir(parents=True, exist_ok=True)
    SEMANTIC_PATH.write_text(json.dumps(reg, indent=1, ensure_ascii=False), encoding="utf-8")


def known_keys(department: Optional[str] = None) -> list[str]:
    reg = _load()
    keys = sorted({i["concept_key"] for i in reg["items"] if not department or i["department"] == department})
    return keys


def reset() -> None:
    with _lock:
        _save({"items": []})


def remove_document(doc_id: str) -> None:
    with _lock:
        reg = _load()
        reg["items"] = [i for i in reg["items"] if i.get("doc_id") != doc_id]
        _save(reg)


def remove_fact(fact_id: str) -> None:
    with _lock:
        reg = _load()
        reg["items"] = [i for i in reg["items"] if i.get("fact_id") != fact_id]
        _save(reg)


def _known_block(department: Optional[str] = None) -> str:
    keys = known_keys(department)
    return "KNOWN KEYS:\n" + ("\n".join(keys) if keys else "(none yet)")


def analyze_document(meta: dict, chunks: list[tuple[str, str]], llm_structured) -> DocAnalysis:
    """meta: doc_id, title, owner, version, valid_from, valid_to. chunks: [(chunk_id, text)].
    llm_structured(system, user, model, max_tokens) -> model instance."""
    body = "\n\n".join(f"[chunk {i}] {t}" for i, (_, t) in enumerate(chunks))
    user = (f"{_taxonomy_block()}\n\n{_known_block()}\n\nDOCUMENT: {meta['title']} (version {meta.get('version') or '-'}, "
            f"owner {meta.get('owner') or '-'}, valid from {meta.get('valid_from')})\n\n{body}")
    return llm_structured(ANALYZE_SYSTEM, user, DocAnalysis, 6000)


def analyze_fact(expert: str, topic: str, question: str, answer: str, llm_structured) -> FactAnalysis:
    user = (f"{_taxonomy_block()}\n\n{_known_block()}\n\nEXPERT: {expert}\nTOPIC: {topic}\nQUESTION: {question}\nANSWER: {answer}")
    return llm_structured(FACT_SYSTEM, user, FactAnalysis, 2500)


def _valid_department(d: str) -> str:
    return d if d in department_keys() else "other"


def record_document(meta: dict, chunks: list[tuple[str, str]], analysis: DocAnalysis) -> list[dict]:
    dep = _valid_department(analysis.department)
    rows = []
    for it in analysis.items:
        idx = it.chunk_index if 0 <= it.chunk_index < len(chunks) else 0
        rows.append({
            "concept_key": it.concept_key.strip().lower(), "kind": it.kind, "statement": it.statement,
            "value": it.value, "unit": it.unit, "condition": it.condition, "department": dep,
            "origin": "document", "doc_id": meta["doc_id"], "chunk_id": chunks[idx][0], "title": meta["title"],
            "version": meta.get("version", ""), "valid_from_i": meta["valid_from_i"], "valid_to_i": meta["valid_to_i"],
            "fact_id": "", "expert": "", "review_status": "approved", "kb_verdict": "",
        })
    with _lock:
        reg = _load()
        reg["items"] = [i for i in reg["items"] if i.get("doc_id") != meta["doc_id"]] + rows
        _save(reg)
    return rows


def record_fact(fact_row: dict, analysis: FactAnalysis) -> list[dict]:
    dep = _valid_department(analysis.department)
    if analysis.unknown_terms:
        with _lock:
            reg = _load()
            reg.setdefault("unknown_terms", []).append({"fact_id": fact_row["id"], "expert": fact_row["expert"],
                                                         "terms": analysis.unknown_terms, "department": dep})
            _save(reg)
    rows = [{
        "concept_key": it.concept_key.strip().lower(), "kind": it.kind, "statement": it.statement,
        "value": it.value, "unit": it.unit, "condition": it.condition, "department": dep,
        "origin": "interview", "doc_id": fact_row["doc_id"], "chunk_id": fact_row["id"], "title": fact_row["title"],
        "version": fact_row.get("version", ""), "valid_from_i": _d2i(fact_row["valid_from"]), "valid_to_i": _d2i(fact_row["valid_to"]),
        "fact_id": fact_row["id"], "expert": fact_row["expert"], "review_status": fact_row["review_status"],
        "kb_verdict": fact_row.get("kb_verdict", ""),
    } for it in analysis.items]
    with _lock:
        reg = _load()
        reg["items"] = [i for i in reg["items"] if i.get("fact_id") != fact_row["id"]] + rows
        _save(reg)
    return rows


def set_fact_status(fact_id: str, review_status: str, reviewer: str = "") -> None:
    with _lock:
        reg = _load()
        for i in reg["items"]:
            if i.get("fact_id") == fact_id:
                i["review_status"] = review_status
                i["reviewer"] = reviewer
        _save(reg)


def _d2i(d: Optional[str]) -> int:
    from .validity import OPEN_END, date_to_int
    return date_to_int(d) or OPEN_END


def update_supersession(old_doc_id: str, new_vf: int, new_doc_id: str) -> None:
    with _lock:
        reg = _load()
        for i in reg["items"]:
            if i.get("doc_id") == old_doc_id and i["valid_to_i"] > new_vf:
                i["valid_to_i"] = new_vf
                i["superseded_by"] = new_doc_id
        _save(reg)


# -- views -----------------------------------------------------------------
def _item_view(i: dict, as_of_i: int) -> dict:
    v = dict(i)
    v["valid_from"] = int_to_date(i["valid_from_i"])
    v["valid_to"] = int_to_date(i["valid_to_i"])
    v["validity_status"] = validity_status(i["valid_from_i"], i["valid_to_i"], as_of_i)
    return v


def concepts(department: Optional[str] = None, as_of: Optional[str] = None, expert: Optional[str] = None) -> list[dict]:
    """Concept cards: per key the document timeline (value per version) and the linked interview statements."""
    from .validity import date_to_int
    as_of_i = date_to_int(as_of) or today_int()
    reg = _load()
    by_key: dict[str, dict] = {}
    for i in reg["items"]:
        if department and i["department"] != department:
            continue
        c = by_key.setdefault(i["concept_key"], {"concept_key": i["concept_key"], "department": i["department"],
                                                  "kind": i["kind"], "timeline": [], "facts": []})
        (c["timeline"] if i["origin"] == "document" else c["facts"]).append(_item_view(i, as_of_i))
    out = []
    for c in by_key.values():
        c["timeline"].sort(key=lambda x: (x["valid_from_i"], x["doc_id"]))
        cur = [x for x in c["timeline"] if x["validity_status"] == "current"]
        c["current_value"] = (cur[-1]["value"] or cur[-1]["statement"]) if cur else ""
        c["current_source"] = cur[-1]["doc_id"] if cur else ""
        c["changed"] = len({x["value"] for x in c["timeline"] if x["value"]}) > 1
        c["approver"] = approver_for(c["department"])
        c["confirmed_by"] = sorted({f["expert"] for f in c["facts"] if f["review_status"] == "approved"})
        c["mentioned_by"] = sorted({f["expert"] for f in c["facts"]})
        if expert:
            c["covered_by_expert"] = expert in c["mentioned_by"]
        out.append(c)
    return sorted(out, key=lambda c: (c["department"], not c["changed"], c["concept_key"]))


def concept(key: str, as_of: Optional[str] = None) -> Optional[dict]:
    return next((c for c in concepts(None, as_of) if c["concept_key"] == key), None)


def uncovered_for(expert: str, department: Optional[str], limit: int = 12) -> list[str]:
    """Concept keys of a department no statement of this expert is linked to yet (interviewer coverage)."""
    return [c["concept_key"] for c in concepts(department, None, expert) if not c.get("covered_by_expert")][:limit]


def unknown_terms(expert: Optional[str] = None) -> list[dict]:
    reg = _load()
    return [u for u in reg.get("unknown_terms", []) if not expert or u["expert"] == expert]


def summary(department: Optional[str] = None) -> dict:
    cs = concepts(department)
    return {"concepts": len(cs), "changed": sum(1 for c in cs if c["changed"]),
            "with_expert_statements": sum(1 for c in cs if c["facts"]),
            "departments": sorted({c["department"] for c in cs})}
