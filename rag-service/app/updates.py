"""Write-back of approved interview facts to the source data folder (../database/_updates/).

Every approval produces one human-readable markdown file and one line in ledger.csv, so the source
data records who said it, when, who approved it, and what kind of change it is. The policy documents
themselves are never edited automatically: a 'correction' tells the document owner that a new version is due.
"""
import csv
import re
from pathlib import Path

from . import config

UPDATES_DIR = config.ROOT.parent / "database" / "_updates"
LEDGER = UPDATES_DIR / "ledger.csv"
COLUMNS = ["fact_id", "expert", "topic", "department", "concepts", "interviewed_at", "approved_by", "approved_at", "change_type",
           "delta_type", "kb_verdict", "related_docs", "question", "answer", "note", "file"]

DELTA_TYPE = {  # Delta Engine label: what the expert answer is relative to the knowledge base
    "correct": "NO_CHANGE",
    "plausible": "ADD",
    "unsupported": "ADD",
    "contradicted": "CONFLICT",
    "possibly_outdated": "SUPERSEDED",   # a current document already replaced what the expert said
}
# "UPDATE" is set at approval with resolution=supersede (the fact replaces the cited passages).


def delta_type(kb_verdict: str) -> str:
    return DELTA_TYPE.get(kb_verdict or "", "UNCLASSIFIED")


CHANGE_TYPE = {  # what the approval means for the source data
    "unsupported": "new_knowledge",      # in no document until now
    "contradicted": "correction",        # differs from a current document; owner must revise it
    "possibly_outdated": "historical",   # matches a superseded rule; kept as history only
    "correct": "confirmation",
    "plausible": "confirmation",
}
CHANGE_TEXT = {
    "new_knowledge": "New knowledge. No document covered this before the interview.",
    "correction": "Correction. The approved answer differs from a current document; the document owner should issue a new version.",
    "historical": "Historical. Matches a rule that has since been replaced; kept for context only.",
    "confirmation": "Confirmation. Consistent with the current documents.",
    "update": "Update. The approved answer replaces the cited passage(s); their validity was closed at the fact's valid_from. "
              "The document owner should issue a new version.",
    "unclassified": "Unclassified. The automatic check did not run.",
}


def _split_qa(text: str) -> tuple[str, str]:
    q = re.search(r"^Q: (.*)$", text, re.M)
    a = re.search(r"^A: (.*)$", text, re.M | re.S)
    return (q.group(1).strip() if q else ""), (a.group(1).strip() if a else text)


def record_approval(fact: dict, related_docs: list[str]) -> dict:
    """fact = row returned by KnowledgeStore.set_review after an approval."""
    UPDATES_DIR.mkdir(parents=True, exist_ok=True)
    dtype = fact.get("delta_type") or delta_type(fact.get("kb_verdict", ""))
    change = "update" if dtype == "UPDATE" else CHANGE_TYPE.get(fact.get("kb_verdict", ""), "unclassified")
    question, answer = _split_qa(fact["text"])
    slug = re.sub(r"[^a-z0-9]+", "-", fact["expert"].lower()).strip("-")
    approved_at = fact.get("reviewed_at", "")
    fname = f"{approved_at[:10] or 'undated'}_{slug}_{fact['id'].split(':')[-1]}.md"
    md = (
        f"# Source data update: {change.replace('_', ' ')}\n\n"
        f"| field | value |\n|---|---|\n"
        f"| expert | {fact['expert']} |\n| topic | {fact['topic']} |\n| department | {fact.get('department', '')} |\n"
        f"| concepts | {', '.join(fact.get('concept_keys', [])) or '-'} |\n| interviewed_at | {fact['valid_from']} |\n"
        f"| approved_by | {fact['reviewer']} |\n| approved_at | {approved_at} |\n| change_type | {change} |\n"
        f"| delta_type | {dtype} |\n"
        f"| automatic check | {fact.get('kb_verdict', '')} |\n| related documents | {', '.join(related_docs) or '-'} |\n"
        + (f"| supersedes chunks | {', '.join(fact.get('superseded_chunks', []))} |\n" if fact.get("superseded_chunks") else "")
        +
        f"| fact_id | {fact['id']} |\n\n"
        f"**What is new.** {CHANGE_TEXT[change]}\n\n"
        f"**Question.** {question}\n\n**Answer (approved).** {answer}\n\n"
        + (f"**Check explanation.** {fact.get('kb_explanation', '')}\n\n" if fact.get("kb_explanation") else "")
        + (f"**Reviewer note.** {fact['review_note']}\n" if fact.get("review_note") else "")
    )
    (UPDATES_DIR / fname).write_text(md, encoding="utf-8")
    row = {"fact_id": fact["id"], "expert": fact["expert"], "topic": fact["topic"], "department": fact.get("department", ""),
           "concepts": ";".join(fact.get("concept_keys", [])), "interviewed_at": fact["valid_from"],
           "approved_by": fact["reviewer"], "approved_at": approved_at, "change_type": change, "delta_type": dtype,
           "kb_verdict": fact.get("kb_verdict", ""), "related_docs": ";".join(related_docs),
           "question": question, "answer": answer, "note": fact.get("review_note", ""), "file": fname}
    new = not LEDGER.exists()
    with LEDGER.open("a", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        if new:
            w.writeheader()
        w.writerow(row)
    return row


def list_updates() -> list[dict]:
    if not LEDGER.exists():
        return []
    with LEDGER.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        r["related_docs"] = [d for d in r["related_docs"].split(";") if d]
        r["concepts"] = [d for d in r.get("concepts", "").split(";") if d]
        r["change_text"] = CHANGE_TEXT.get(r["change_type"], "")
    return sorted(rows, key=lambda r: r["approved_at"], reverse=True)
