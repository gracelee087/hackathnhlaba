"""Reset the service and load the synthetic knowledge sources from ../database/
(28 documents (11 EN + 11 DE + 6 e-mails) from manifest.json + every *_Interview_*.json as interview facts).
Usage (from rag-service/, server running):  python scripts/load_demo.py [http://localhost:8001]
"""
import json
import sys
from pathlib import Path

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8001"
ROOT = Path(__file__).resolve().parent.parent
DB = ROOT.parent / "database"

requests.post(f"{BASE}/admin/reset", timeout=60).raise_for_status()
print("reset OK")

for entry in json.loads((DB / "manifest.json").read_text(encoding="utf-8")):
    name = entry["file"]
    if Path(name).suffix:                      # explicit file name (docx, pptx, txt, md)
        path = DB / name
    else:                                      # markdown source rendered to pdf/ by make_demo_pdfs.py
        pdf = DB / "pdf" / f"{name}.pdf"
        path = pdf if pdf.exists() else DB / f"{name}.md"
    with path.open("rb") as fh:
        r = requests.post(f"{BASE}/ingest", files={"file": (path.name, fh)}, data=entry["meta"], timeout=300)
    if r.status_code != 200:
        sys.exit(f"ingest failed for {path.name}: {r.status_code} {r.text[:300]}")
    j = r.json()
    print(f"ingested {j['doc_id']}: {j['chunks']} chunks from {path.name}; department={j.get('department')} "
          f"({(j.get('department_reason') or '')[:60]}); concepts={len(j.get('concepts', []))}; superseded: {j.get('superseded_doc')}")

for fp in sorted(DB.glob("*_Interview_*.json")):
    for fact in json.loads(fp.read_text(encoding="utf-8")):
        r = requests.post(f"{BASE}/facts", json=fact, timeout=240)
        if r.status_code != 200:
            sys.exit(f"fact failed: {r.status_code} {r.text[:300]}")
        j = r.json()
        print(f"fact {j['id']} [{j['review_status']}, kb={j['kb_verdict']}, dept={j.get('department')}, approver={j.get('approver')}] "
              f"{fact['expert']}: {fact['question'][:45]} -> {j.get('concept_keys')}")

sem = requests.get(f"{BASE}/semantic", timeout=60).json()
print(f"semantic layer: {sem['summary']}")
for c in sem["concepts"]:
    if c["changed"] or c["facts"]:
        tl = " -> ".join(f"{x['value'] or x['statement'][:30]} ({x['doc_id']}, {x['validity_status']})" for x in c["timeline"])
        print(f"  [{c['department']}] {c['concept_key']}: {tl} | experts: {c['mentioned_by']}")
docs = requests.get(f"{BASE}/documents", timeout=60).json()["documents"]
for d in docs:
    print(f"  {d['doc_id']:<28} {d['valid_from']} -> {d['valid_to'] or 'open':<10} {d['status_today']:<18} superseded_by={d['superseded_by']}")
