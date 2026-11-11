"""Dump what is inside the vector store (Chroma) into a folder people can open:
../database/_chroma_snapshot/chunks.csv (one row per chunk, metadata + text) and chunks.jsonl.
Usage (from rag-service/):  python scripts/export_chroma.py
"""
import csv
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))
import json
from pathlib import Path

from app import config
from app.store import KnowledgeStore
from app.validity import int_to_date

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT.parent / "database" / "_chroma_snapshot"
OUT.mkdir(parents=True, exist_ok=True)

store = KnowledgeStore()
res = store.col.get(include=["documents", "metadatas"])
rows = []
for cid, text, m in zip(res["ids"], res["documents"], res["metadatas"]):
    rows.append({
        "id": cid, "origin": m.get("origin"), "doc_id": m.get("doc_id"), "title": m.get("title"),
        "doc_type": m.get("doc_type"), "version": m.get("version"), "page": m.get("page"), "section": m.get("section"),
        "valid_from": int_to_date(m.get("valid_from_i")), "valid_to": int_to_date(m.get("valid_to_i")),
        "supersedes": m.get("supersedes"), "superseded_by": m.get("superseded_by"),
        "approved": m.get("approved"), "review_status": m.get("review_status"),
        "expert": m.get("expert", ""), "kb_verdict": m.get("kb_verdict", ""), "kb_explanation": m.get("kb_explanation", ""),
        "chars": len(text), "text": text,
    })
rows.sort(key=lambda r: (r["origin"] or "", r["doc_id"] or "", r["page"] or 0, r["id"]))
with (OUT / "chunks.csv").open("w", newline="", encoding="utf-8-sig") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()) if rows else ["id"])
    w.writeheader()
    w.writerows(rows)
with (OUT / "chunks.jsonl").open("w", encoding="utf-8") as fh:
    for r in rows:
        fh.write(json.dumps(r, ensure_ascii=False) + "\n")
(OUT / "README.md").write_text(
    f"Snapshot of the Chroma collection `{config.COLLECTION}` ({len(rows)} chunks), written by "
    "`rag-service/scripts/export_chroma.py`. Derived data: regenerate after `load_demo.py`; do not edit by hand. "
    "The vectors themselves (768 numbers per chunk) are not exported; they live in `rag-service/data/chroma/`.\n",
    encoding="utf-8")
print(f"collection {config.COLLECTION}: {len(rows)} chunks -> {OUT.relative_to(ROOT.parent)}")
