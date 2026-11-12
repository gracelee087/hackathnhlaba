"""Ingest the dashboard's seed knowledge articles (teammate React frontend) into the RAG service.

Input : data/dashboard_articles/articles.json  (JSON dump of SEED_ARTICLES, produced with esbuild + node)
Output: data/dashboard_articles/<id>.md, one per article, then POST /ingest for each.
Idempotent: a doc_id that already exists in GET /documents is deleted first.

Run:  python -I scripts/ingest_dashboard_articles.py [--base http://localhost:8001] [--today 2026-11-12]
"""
import argparse
import json
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "dashboard_articles"
DOC_TYPE_BY_CATEGORY = {"Regulatorik": "circular", "Tarife": "manual"}


def write_markdown(a: dict) -> Path:
    lines = [f"# {a['title']}", "", a.get("description", ""), ""]
    for para in a.get("content", []):
        lines += [para, ""]
    footer = []
    if a.get("tags"):
        footer.append("Tags: " + ", ".join(a["tags"]))
    if a.get("sourceDocuments"):
        footer.append("Quellen: " + ", ".join(a["sourceDocuments"]))
    if footer:
        lines += ["---", " | ".join(footer), ""]
    path = DATA_DIR / f"{a['id']}.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def build_meta(a: dict, supersedes_map: dict, taxonomy_keys: set, today: str) -> dict:
    meta = {
        "doc_id": a["id"],
        "title": a["title"],
        "doc_type": DOC_TYPE_BY_CATEGORY.get(a.get("category"), "other"),
        "valid_from": a["validFrom"],
        "owner": "LBS",
        "language": "de",
    }
    valid_to = a.get("validUntil")
    if valid_to is None and a.get("status") == "veraltet":
        valid_to = today
    if valid_to:
        meta["valid_to"] = valid_to
    if a["id"] in supersedes_map:
        meta["supersedes"] = supersedes_map[a["id"]]
    if a.get("department") in taxonomy_keys:
        meta["department"] = a["department"]
    return meta


def order_after_superseded(articles: list, supersedes_map: dict) -> list:
    by_id = {a["id"]: a for a in articles}
    ordered, seen = [], set()

    def visit(a):
        if a["id"] in seen:
            return
        older = supersedes_map.get(a["id"])
        if older in by_id:
            visit(by_id[older])
        seen.add(a["id"])
        ordered.append(a)

    for a in articles:
        visit(a)
    return ordered


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8001")
    ap.add_argument("--today", default=time.strftime("%Y-%m-%d"))
    ap.add_argument("--input", default=str(DATA_DIR / "articles.json"))
    ap.add_argument("--only", default="", help="comma-separated article ids to (re)ingest; default = all")
    args = ap.parse_args()
    base = args.base.rstrip("/")

    articles = json.loads(Path(args.input).read_text(encoding="utf-8"))
    # inverse of supersededBy: new_id -> old_id
    supersedes_map = {a["supersededBy"]: a["id"] for a in articles if a.get("supersededBy")}
    # the store links superseded_by on the OLD document only if it already exists when the NEW one arrives,
    # so ingest every article after the one it supersedes (stable order otherwise)
    articles = order_after_superseded(articles, supersedes_map)
    if args.only:
        articles = [a for a in articles if a["id"] in set(args.only.split(","))]
    taxonomy_keys = {d["key"] for d in requests.get(f"{base}/taxonomy", timeout=30).json()["departments"]}
    existing = {d["doc_id"] for d in requests.get(f"{base}/documents", timeout=30).json()["documents"]}
    print(f"{len(articles)} articles | {len(existing)} documents in store before | taxonomy keys: {sorted(taxonomy_keys)}")

    failures = []
    t_total = time.perf_counter()
    for a in articles:
        md = write_markdown(a)
        meta = build_meta(a, supersedes_map, taxonomy_keys, args.today)
        t0 = time.perf_counter()
        if a["id"] in existing:
            requests.delete(f"{base}/documents/{a['id']}", timeout=60).raise_for_status()
        with md.open("rb") as fh:
            r = requests.post(f"{base}/ingest", data=meta, files={"file": (md.name, fh, "text/markdown")}, timeout=600)
        dt = time.perf_counter() - t0
        if r.ok:
            body = r.json()
            print(f"OK   {a['id']:<18} chunks={body.get('chunks', '?'):<3} dept={body.get('department', '?'):<18} "
                  f"valid={meta['valid_from']}..{meta.get('valid_to', 'open')} supersedes={meta.get('supersedes', '-')} "
                  f"{'(replaced)' if a['id'] in existing else ''} {dt:.1f}s")
        else:
            failures.append((a["id"], r.status_code, r.text[:300]))
            print(f"FAIL {a['id']:<18} HTTP {r.status_code}: {r.text[:200]} {dt:.1f}s")
    total = time.perf_counter() - t_total
    after = len(requests.get(f"{base}/documents", timeout=30).json()["documents"])
    print(f"done: {len(articles) - len(failures)} ok, {len(failures)} failed | documents after: {after} | total {total:.1f}s")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
