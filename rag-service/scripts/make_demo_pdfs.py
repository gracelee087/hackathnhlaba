"""Render the markdown circulars in ../database/ (manifest entries without a file extension)
to ../database/pdf/*.pdf so the demo ingests real PDFs.
Usage (from rag-service/):  python scripts/make_demo_pdfs.py
"""
import json
import textwrap
from pathlib import Path

import fitz  # pymupdf

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT.parent / "database"
OUT = DB / "pdf"
OUT.mkdir(exist_ok=True)

LINES_PER_PAGE = 55

stems = [e["file"] for e in json.loads((DB / "manifest.json").read_text(encoding="utf-8")) if not Path(e["file"]).suffix]
for stem in stems:
    md = DB / f"{stem}.md"
    lines: list[str] = []
    # the base-14 Helvetica font has no glyphs for these; umlauts and ß are fine
    text = md.read_text(encoding="utf-8")
    for a, b in {"≥": ">=", "≤": "<=", "–": "-", "—": "-", "→": "->", "€": "EUR", "•": "-"}.items():
        text = text.replace(a, b)
    for raw in text.splitlines():
        if raw.startswith("#"):
            lines += ["", raw.lstrip("#").strip(), ""]
        else:
            lines += textwrap.wrap(raw, 95) or [""]
    doc = fitz.open()
    for i in range(0, len(lines), LINES_PER_PAGE):
        page = doc.new_page()  # A4
        page.insert_text((50, 60), "\n".join(lines[i:i + LINES_PER_PAGE]), fontsize=10, fontname="helv")
    out = OUT / f"{stem}.pdf"
    doc.save(out)
    print(f"wrote {out.relative_to(ROOT.parent)}: {doc.page_count} page(s)")
