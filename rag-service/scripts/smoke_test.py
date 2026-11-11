"""Smoke test = the success conditions of the RAG block.
Needs a running server with the database/ folder loaded (scripts/load_demo.py).
Usage (from rag-service/):  python scripts/smoke_test.py [http://localhost:8001]

a) time validity in search and supersession
b) human in the loop: draft interview facts are hidden until approved
c) /check verdicts via the LLM (skipped if the LLM is not reachable)
e) new interview facts are auto-checked against the KB on arrival
d) /export separates current from historical knowledge, with citations
s) semantic layer: department filter, concept cards, unknown terms
l) bilingual corpus: language filter, German questions and explanations
"""
import re
import sys

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8001"
TODAY = "2026-11-11"
V1, V2 = "credit-policy-2022-v1", "credit-policy-2025-v2"
EXPERT, TOPIC_IV = "Dr. Petra Hoffmann", "SME corporate lending and credit analysis"
results: list[tuple[str, bool | None, str]] = []


def rec(name: str, ok: bool | None, detail: str = "") -> None:
    results.append((name, ok, detail))
    tag = "SKIP" if ok is None else ("PASS" if ok else "FAIL")
    print(f"{tag}  {name}" + (f"\n      {detail}" if detail else ""))


def search(**params):
    return requests.get(f"{BASE}/search", params=params, timeout=120).json()["hits"]


def german(text: str) -> bool:
    """Heuristic: at least one German function word and no English 'the'."""
    return bool(re.search(r"\b(die|der|sie|du|wie|welche)\b", text, re.I)) and not re.search(r"\bthe\b", text, re.I)


# a) time validity ---------------------------------------------------
q = "approval limits for corporate loans: four-eyes, Head of Credit Analysis, Credit Committee"
old = search(q=q, as_of="2024-06-01", k=10)
new = search(q=q, as_of=TODAY, k=10)
old_cur = [h for h in old if h["validity_status"] == "current"]
rec("a1 as_of 2024-06-01: top hit is current then, Credit Policy v1 among current hits, v2 absent or not_yet_valid",
    bool(old) and old[0]["validity_status"] == "current" and any(h["doc_id"] == V1 for h in old_cur)
    and all(h["doc_id"] != V2 for h in old_cur),
    old[0]["citation"] if old else "no hits")
cur = [h for h in new if h["validity_status"] == "current"]
hist = [h for h in new if h["validity_status"] == "possibly_outdated"]
rec("a2 as_of today: v2 among current hits, v1 appears as possibly_outdated, never as current",
    any(h["doc_id"] == V2 for h in cur) and any(h["doc_id"] == V1 for h in hist) and all(h["doc_id"] != V1 for h in cur),
    "; ".join(f"{h['doc_id']}={h['validity_status']}" for h in new))
docs = {d["doc_id"]: d for d in requests.get(f"{BASE}/documents", timeout=60).json()["documents"]}
rec("a3 supersession closed v1 window at 2025-07-01",
    docs.get(V1, {}).get("valid_to") == "2025-07-01" and docs.get(V1, {}).get("superseded_by") == V2,
    str({k: docs.get(V1, {}).get(k) for k in ("valid_to", "superseded_by", "status_today")}))

# b) human in the loop ------------------------------------------------
drafts = [f for s in ("draft", "needs_review")
          for f in requests.get(f"{BASE}/facts", params={"status": s}, timeout=60).json()["facts"]]
target = next((f for f in drafts if f.get("expert") == EXPERT and "order backlog" in f["text"] and "1.5 times" in f["text"]), None)
fq = "how to tell a seasonal liquidity dip from a real liquidity problem"
before = search(q=fq, as_of=TODAY, k=5, origin="interview")
rec("b1 draft interview fact hidden from default search",
    target is not None and not any(h["id"] == target["id"] for h in before),
    f"draft id={target['id'] if target else None}; interview hits before approval={len(before)}")
if target:
    requests.post(f"{BASE}/facts/{target['id']}/approve", params={"reviewer": "smoke", "note": "verified"}, timeout=60)
    after = search(q=fq, as_of=TODAY, k=5, origin="interview")
    rec("b2 approved fact visible with expert citation",
        any(h["id"] == target["id"] for h in after),
        next((h["citation"] for h in after if h["id"] == target["id"]), "not found"))
    unapproved = search(q=fq, as_of=TODAY, k=5, origin="interview", include_unapproved=True)
    rec("b3 reviewer view (include_unapproved) still shows remaining drafts",
        any(h["review_status"] == "draft" for h in unapproved), f"{len(unapproved)} interview hits")

# c) statement check (LLM) -----------------------------------------
def check(statement: str, as_of: str, lang: str = "en"):
    r = requests.post(f"{BASE}/check", json={"statement": statement, "as_of": as_of, "lang": lang}, timeout=240)
    return (r.json(), "") if r.status_code == 200 else (None, f"{r.status_code} {r.text[:160]}")


S_FOUR_EYES = "Together with the relationship manager a credit analyst can decide up to EUR 1.0 million total exposure."
v, err = check(S_FOUR_EYES, TODAY)
if v is None:
    rec("c  /check via LLM", None, "skipped: " + err)
else:
    rec("c1 'four-eyes up to EUR 1.0 million' as of today -> possibly_outdated", v["verdict"] == "possibly_outdated",
        f"{v['verdict']} | {v['what_applies_today'][:140]}")
    cases = [
        ("c2 'four-eyes up to EUR 1.0 million' as of 2024-06-01 -> correct",
         S_FOUR_EYES, "2024-06-01", ("correct",)),
        ("c3 unchanged-today rule (Credit Committee above EUR 5.0 million) -> correct",
         "The Credit Committee decides every exposure above EUR 5.0 million.", TODAY, ("correct",)),
        ("c4 '12 months old statements' as of today -> possibly_outdated or contradicted (v2 says 9 months)",
         "Annual financial statements may be up to 12 months old at decision.", TODAY, ("possibly_outdated", "contradicted")),
    ]
    for name, stmt, as_of, want in cases:
        r, err = check(stmt, as_of)
        rec(name, bool(r) and r["verdict"] in want, (f"{r['verdict']} | {r['explanation'][:140]}" if r else err))

# e) new interview knowledge is auto-checked against the KB on arrival ---
def post_fact(question: str, answer: str, **extra):
    body = {"expert": "Smoke Tester", "topic": TOPIC_IV, "question": question, "answer": answer,
            "interviewed_at": TODAY, **extra}
    r = requests.post(f"{BASE}/facts", json=body, timeout=240)
    return r.json() if r.status_code == 200 else None


f1 = post_fact("What do you do before you vote on an owner-managed company?",
               "Whenever the owner is over 60 I ask for the succession plan before I look at the machines, "
               "and I want to meet the designated successor in person once before I vote.")
rec("e1 undocumented expert knowledge -> kb_verdict unsupported, stays draft",
    bool(f1) and f1["kb_verdict"] == "unsupported" and f1["review_status"] == "draft",
    f"{f1['kb_verdict']} / {f1['review_status']} | {f1['kb_explanation'][:120]}" if f1 else "POST /facts failed")
f2 = post_fact("What is the minimum DSCR for a corporate loan today?",
               "The minimum DSCR for corporate loans is 1.50.")
rec("e2 fact conflicting with current Credit Policy -> contradicted -> needs_review",
    bool(f2) and f2["kb_verdict"] == "contradicted" and f2["review_status"] == "needs_review",
    f"{f2['kb_verdict']} / {f2['review_status']} | {f2['kb_explanation'][:120]}" if f2 else "POST /facts failed")
if f2:
    queue = requests.get(f"{BASE}/facts", params={"status": "needs_review"}, timeout=60).json()["facts"]
    rec("e3 needs_review queue lists the conflicting fact", any(f["id"] == f2["id"] for f in queue), f"{len(queue)} in queue")
for f in (f1, f2):  # keep the demo queue clean
    if f:
        requests.post(f"{BASE}/facts/{f['id']}/reject", params={"reviewer": "smoke", "note": "smoke test"}, timeout=60)

# d) export -------------------------------------------------------------
TOPIC = "credit approval limits and policy exceptions for corporate loans"
ex = requests.get(f"{BASE}/export", params={"topic": TOPIC, "as_of": TODAY, "k": 12}, timeout=120).json()
rec("d1 export: current has no v1, historical contains v1",
    bool(ex["current"]) and all(h["doc_id"] != V1 for h in ex["current"]) and any(h["doc_id"] == V1 for h in ex["historical"]),
    f"current={len(ex['current'])} historical={len(ex['historical'])}")
rec("d2 export: every item carries a citation", all(h["citation"] for h in ex["current"] + ex["historical"]),
    ex["sources"][0] if ex["sources"] else "no sources")

ex2 = requests.get(f"{BASE}/export", params={"topic": TOPIC, "as_of": TODAY, "audience": "beginner",
                                             "k": 12, "outline": "true"}, timeout=300)
if ex2.status_code != 200:
    rec("d3 export outline via LLM", None, "skipped: " + ex2.text[:160])
else:
    o = ex2.json().get("outline") or {}
    rec("d3 outline has sections, a speaker script per section and quiz seeds (for the Media block)",
        bool(o.get("sections")) and bool(o.get("quiz_seeds")) and all(len(s.get("speaker_script", "")) > 40 for s in o["sections"]),
        f"{o.get('title', '')[:70]} | sections={len(o.get('sections', []))} "
        f"quiz={len(o.get('quiz_seeds', []))} validity_notes={len(o.get('validity_notes', []))}")

# s) semantic layer ------------------------------------------------------
sr = requests.get(f"{BASE}/search", params={"q": "credit approval limit", "as_of": TODAY, "k": 8,
                                            "department": "Kreditanalyse"}, timeout=120).json()
s_hits = sr.get("hits", [])
rec("s1 /search department alias 'Kreditanalyse' resolves to key 'credit_analysis' and scopes every hit",
    sr.get("department") == "credit_analysis" and all(h.get("department", "credit_analysis") == "credit_analysis" for h in s_hits),
    f"department={sr.get('department')} hits={len(s_hits)} "
    f"hit_departments={sorted({h.get('department', '') for h in s_hits})}")
sem_rm = requests.get(f"{BASE}/semantic", params={"department": "risk_management"}, timeout=120).json().get("concepts", [])
sem_ca = requests.get(f"{BASE}/semantic", params={"department": "credit_analysis"}, timeout=120).json().get("concepts", [])
changed = [c["concept_key"] for c in sem_rm + sem_ca if c.get("changed")]
rec("s2 /semantic?department=risk_management: a 'risk_management.' concept exists and one concept changed across "
    "policy versions (approval limits) in risk_management or credit_analysis",
    any(c["concept_key"].startswith("risk_management.") for c in sem_rm) and bool(changed),
    f"risk_management concepts={len(sem_rm)} credit_analysis concepts={len(sem_ca)} changed={changed[:5]}")
ut = requests.get(f"{BASE}/semantic/unknown-terms", timeout=60).json()
rec("s3 /semantic/unknown-terms returns an 'unknown_terms' list",
    isinstance(ut, dict) and isinstance(ut.get("unknown_terms"), list),
    f"{len(ut.get('unknown_terms', []))} unknown terms" if isinstance(ut, dict) else str(ut)[:120])

# l) bilingual corpus -----------------------------------------------------
de_hits = search(q="Genehmigungsgrenzen Gesamtobligo Vier-Augen-Prinzip Kreditausschuss", as_of=TODAY, k=8, language="de")
rec("l1 /search?language=de returns only German chunks, at least one",
    bool(de_hits) and all(h.get("language") == "de" for h in de_hits),
    f"hits={len(de_hits)} languages={sorted({h.get('language', '') for h in de_hits})}")
nq = requests.post(f"{BASE}/interview/next", json={"expert": EXPERT, "topic": TOPIC_IV, "as_of": TODAY, "lang": "de", "turns": []},
                   timeout=240)
if nq.status_code != 200:
    rec("l2 /interview/next lang=de via LLM", None, "skipped: " + nq.text[:160])
else:
    question = nq.json().get("question", "")
    rec("l2 /interview/next lang=de: the opening question is German", german(question), question[:140])
vd, err = check("Zusammen mit dem Firmenkundenbetreuer darf ich bis EUR 1,0 Mio. Gesamtobligo entscheiden.", TODAY, lang="de")
if vd is None:
    rec("l3 /check lang=de via LLM", None, "skipped: " + err)
else:
    rec("l3 /check lang=de: the explanation is German", german(vd["explanation"]),
        f"{vd['verdict']} | {vd['explanation'][:140]}")

# summary ---------------------------------------------------------------
n_pass = sum(1 for _, ok, _ in results if ok is True)
n_fail = sum(1 for _, ok, _ in results if ok is False)
n_skip = sum(1 for _, ok, _ in results if ok is None)
print(f"\n{n_pass} passed, {n_fail} failed, {n_skip} skipped")
sys.exit(1 if n_fail else 0)
