"""
document_processor.py
Professionelles Hierarchisches + Kontextuelles Chunking für Banken-Compliance.

Strategie (aus dem Artikel, Best Practice für regulatorische Dokumente):

1. HIERARCHISCHES CHUNKING
   Erhält die vollständige Dokumentstruktur:
   Teil → Kapitel → Abschnitt → Artikel → Absatz → Satz

2. KONTEXTUELLES CHUNKING
   Jeder Chunk enthält Metadaten:
   - Artikelnummer (z.B. "Article 92")
   - Eltern-Kontext (Kapiteltitel)
   - Dokumenttyp (CRR, DORA, intern)
   - Seite, Hierarchie-Level

3. SLIDING WINDOW für große Absätze
   Lange Absätze werden mit 20% Overlap aufgeteilt
   damit Kontext an Chunk-Grenzen erhalten bleibt

4. PARENT-CHILD Beziehungen
   Jeder Chunk kennt seinen Parent
   → beim Retrieval kann nach oben erweitert werden

Für interne Dokumente: Heading-basiertes Chunking
Für Regulatorik (CRR, DORA etc.): Artikel/Paragraph-basiertes Chunking
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Generator, Optional

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Chunk-Datenstruktur mit vollem Kontext
# ─────────────────────────────────────────────

@dataclass
class DocumentChunk:
    doc_id: str
    filename: str
    file_type: str
    page: int
    text: str
    metadata: dict = field(default_factory=dict)


# ─────────────────────────────────────────────
# Hierarchie-Erkennung — EU-Regulatorik + Deutsch
# ─────────────────────────────────────────────

# Level 1 — Höchste Ebene (Teil, Titel, Part)
_L1_PATTERNS = [
    re.compile(r'^(TITLE|TITEL|TEIL|PART)\s+[IVXLC\d]+', re.IGNORECASE | re.MULTILINE),
    re.compile(r'^(PART|ABSCHNITT)\s+[IVXLC\d]+\b', re.IGNORECASE | re.MULTILINE),
]

# Level 2 — Kapitel
_L2_PATTERNS = [
    re.compile(r'^(CHAPTER|KAPITEL|ABSCHNITT)\s+[IVXLC\d]+', re.IGNORECASE | re.MULTILINE),
]

# Level 3 — Artikel / Paragraph (Kern der Regulatorik)
_L3_PATTERNS = [
    re.compile(r'^(Article|Artikel|Art\.)\s+\d+[a-z]?', re.IGNORECASE | re.MULTILINE),
    re.compile(r'^§\s*\d+[a-z]?', re.MULTILINE),
    re.compile(r'^Artikel\s+\d+[a-z]?', re.MULTILINE),
]

# Level 4 — Absatz
_L4_PATTERNS = [
    re.compile(r'^\(\d+\)\s+\S', re.MULTILINE),       # (1) Text
    re.compile(r'^Abs(?:atz)?\.?\s+\d+', re.MULTILINE),
    re.compile(r'^\d+\.\s+[A-ZÜÄÖ\(]', re.MULTILINE), # 1. Text
]

# Nummerierte Überschriften (intern)
_HEADING_PATTERNS = [
    re.compile(r'^#+\s+\S', re.MULTILINE),              # Markdown
    re.compile(r'^\d+\.\d+\s+[A-ZÜÄÖ]', re.MULTILINE), # 3.1 Titel
    re.compile(r'^\d+\.\s+[A-ZÜÄÖ]', re.MULTILINE),    # 3. Titel
]


def _detect_level(line: str) -> Optional[int]:
    """Detect hierarchy level of a line. Returns 1-4 or None."""
    line = line.strip()
    if not line:
        return None
    for p in _L1_PATTERNS:
        if p.match(line):
            return 1
    for p in _L2_PATTERNS:
        if p.match(line):
            return 2
    for p in _L3_PATTERNS:
        if p.match(line):
            return 3
    for p in _L4_PATTERNS:
        if p.match(line):
            return 4
    for p in _HEADING_PATTERNS:
        if p.match(line):
            return 2
    return None


def _extract_article_number(text: str) -> str:
    """Extract article/paragraph number from text."""
    patterns = [
        re.compile(r'(Article|Artikel|Art\.)\s+(\d+[a-z]?)', re.IGNORECASE),
        re.compile(r'§\s*(\d+[a-z]?)'),
        re.compile(r'^\((\d+)\)'),
    ]
    for p in patterns:
        m = p.search(text[:100])
        if m:
            return m.group(0).strip()
    return ""


# ─────────────────────────────────────────────
# Segment-Klasse für Hierarchiebaum
# ─────────────────────────────────────────────

@dataclass
class Segment:
    level: int
    title: str
    article_no: str
    text: str
    page: int
    parent_title: str = ""
    parent_article: str = ""
    children: list = field(default_factory=list)


# ─────────────────────────────────────────────
# Sliding Window Splitter (für lange Absätze)
# ─────────────────────────────────────────────

def _sliding_window_split(text: str, max_size: int = 800, overlap: int = 160) -> list[str]:
    """
    Sliding Window Chunking mit 20% Overlap.
    Bricht an Satzgrenzen, nicht mitten im Satz.
    Empfohlen für lange Absätze in regulatorischen Texten.
    """
    text = text.strip()
    if len(text) <= max_size:
        return [text] if text else []

    # Sätze extrahieren
    sentences = re.split(r'(?<=[.!?;])\s+', text)
    chunks = []
    current = ""
    i = 0

    while i < len(sentences):
        sent = sentences[i]
        if len(current) + len(sent) + 1 <= max_size:
            current = (current + " " + sent).strip()
            i += 1
        else:
            if current:
                chunks.append(current)
                # Overlap: gehe zurück bis overlap-Größe erreicht
                overlap_text = ""
                j = i - 1
                while j >= 0 and len(overlap_text) < overlap:
                    overlap_text = sentences[j] + " " + overlap_text
                    j -= 1
                current = overlap_text.strip()
            else:
                # Einzelner Satz zu lang → harter Schnitt
                chunks.append(sent[:max_size])
                current = sent[max_size - overlap:] if len(sent) > max_size else ""
                i += 1

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if c.strip()]


# ─────────────────────────────────────────────
# PDF — Hierarchisches + Kontextuelles Chunking
# ─────────────────────────────────────────────

def _parse_pdf_hierarchical(filepath: Path, subfolder: str = "", chunk_size: int = 800) -> Generator[DocumentChunk, None, None]:
    """PDF-Parsing via PyMuPDF — schnell, zuverlässig, kein externes Modell nötig."""
    yield from _parse_pdf_pymupdf(filepath, subfolder, chunk_size)


def _parse_pdf_unstructured(filepath: Path, subfolder: str, chunk_size: int) -> Generator[DocumentChunk, None, None]:
    """Unstructured.io Parser — strukturierte Elemente mit Typ-Erkennung."""
    from unstructured.partition.auto import partition
    from unstructured.documents.elements import Title, NarrativeText, Table, ListItem, Header

    logger.info(f"PDF via Unstructured.io: {filepath.name}")
    try:
        elements = partition(filename=str(filepath))
    except Exception as e:
        logger.error(f"Unstructured failed for {filepath.name}: {e} — Fallback auf PyMuPDF")
        yield from _parse_pdf_pymupdf(filepath, subfolder, chunk_size)
        return

    # Kontext-Stack
    context = {1: {"title": "", "article": ""}, 2: {"title": "", "article": ""},
               3: {"title": "", "article": ""}, 4: {"title": "", "article": ""}}
    current_seg = None
    chunk_idx = 0

    def emit(seg):
        nonlocal chunk_idx
        if not seg or not seg.get("text", "").strip():
            return
        for c_idx, chunk_text in enumerate(_sliding_window_split(seg["text"], chunk_size, chunk_size // 5)):
            if not chunk_text.strip():
                continue
            yield DocumentChunk(
                doc_id=f"{filepath.name}:c{chunk_idx}",
                filename=filepath.name,
                file_type="pdf",
                page=seg.get("page", 1),
                text=chunk_text,
                metadata={
                    "source": filepath.name,
                    "page": seg.get("page", 1),
                    "title": seg.get("title", ""),
                    "article_no": seg.get("article_no", ""),
                    "parent": seg.get("parent_title", ""),
                    "parent_article": seg.get("parent_article", ""),
                    "level": str(seg.get("level", "body")),
                    "element_type": seg.get("element_type", ""),
                    "subfolder": subfolder,
                },
            )
            chunk_idx += 1

    for element in elements:
        elem_type = type(element).__name__
        text = str(element).strip()
        if not text:
            continue

        # Seitennummer aus Metadaten
        page_num = 1
        if hasattr(element, "metadata") and hasattr(element.metadata, "page_number"):
            page_num = element.metadata.page_number or 1

        # Hierarchie-Erkennung via Unstructured-Elementtyp + Pattern
        is_heading = elem_type in ("Title", "Header") or _detect_level(text) is not None
        lvl = _detect_level(text) or (2 if elem_type == "Title" else (1 if elem_type == "Header" else None))

        if is_heading and lvl:
            if current_seg:
                yield from emit(current_seg)
            article_no = _extract_article_number(text)
            context[lvl] = {"title": text, "article": article_no}
            for deeper in range(lvl + 1, 5):
                context[deeper] = {"title": "", "article": ""}
            parent_title, parent_article = "", ""
            for pl in range(lvl - 1, 0, -1):
                if context[pl]["title"]:
                    parent_title = context[pl]["title"]
                    parent_article = context[pl]["article"]
                    break
            current_seg = {
                "level": lvl, "title": text, "article_no": article_no,
                "text": text, "page": page_num,
                "parent_title": parent_title, "parent_article": parent_article,
                "element_type": elem_type,
            }
        elif elem_type == "Table":
            # Tabellen als eigener Chunk — Kontext erhalten
            if current_seg:
                yield from emit(current_seg)
                current_seg = None
            parent_title = context[3]["title"] or context[2]["title"] or context[1]["title"]
            yield from emit({
                "level": "table", "title": f"Tabelle in {parent_title}" if parent_title else "Tabelle",
                "article_no": context[3]["article"] or context[2]["article"],
                "text": text, "page": page_num,
                "parent_title": parent_title, "parent_article": "",
                "element_type": "Table",
            })
        else:
            if current_seg:
                current_seg["text"] += "\n" + text
            else:
                parent_title = context[3]["title"] or context[2]["title"] or context[1]["title"]
                current_seg = {
                    "level": 0, "title": "", "article_no": context[3]["article"] or context[2]["article"],
                    "text": text, "page": page_num,
                    "parent_title": parent_title, "parent_article": "",
                    "element_type": elem_type,
                }

    if current_seg:
        yield from emit(current_seg)


def _parse_pdf_pymupdf(filepath: Path, subfolder: str, chunk_size: int) -> Generator[DocumentChunk, None, None]:
    """PyMuPDF — schnell, einfach, zuverlässig. Keine Hierarchie-Erkennung."""
    import fitz
    try:
        doc = fitz.open(str(filepath))
    except Exception as e:
        logger.error(f"Cannot open {filepath.name}: {e}")
        return
    n = len(doc)
    logger.info(f"PDF: {filepath.name} ({n} Seiten)")
    chunk_idx = 0
    overlap = max(50, chunk_size // 8)
    buf = ""
    buf_page = 1
    for i, page in enumerate(doc, 1):
        try:
            buf += page.get_text() or ""
            buf_page = i
        except Exception:
            continue
        while len(buf) >= chunk_size:
            t = buf[:chunk_size].strip()
            if t:
                yield DocumentChunk(
                    doc_id=f"{filepath.name}:{chunk_idx}",
                    filename=filepath.name, file_type="pdf",
                    page=buf_page, text=t,
                    metadata={"source": filepath.name, "page": buf_page,
                              "title": "", "article_no": "", "parent": "",
                              "parent_article": "", "level": "chunk", "subfolder": subfolder},
                )
                chunk_idx += 1
            buf = buf[chunk_size - overlap:]
    if buf.strip():
        yield DocumentChunk(
            doc_id=f"{filepath.name}:{chunk_idx}",
            filename=filepath.name, file_type="pdf",
            page=buf_page, text=buf.strip(),
            metadata={"source": filepath.name, "page": buf_page,
                      "title": "", "article_no": "", "parent": "",
                      "parent_article": "", "level": "chunk", "subfolder": subfolder},
        )
    doc.close()
    logger.info(f"  {filepath.name}: {chunk_idx+1} Chunks")


# ─────────────────────────────────────────────
# DOCX — Heading-basiertes hierarchisches Chunking
# ─────────────────────────────────────────────

def _parse_docx_unstructured(filepath: Path, subfolder: str, chunk_size: int) -> Generator[DocumentChunk, None, None]:
    """DOCX via Unstructured.io — erkennt Headings, Tabellen, Listen automatisch."""
    from unstructured.partition.docx import partition_docx
    from unstructured.documents.elements import Title, Table, Header
    logger.info(f"DOCX via Unstructured.io: {filepath.name}")
    elements = partition_docx(filename=str(filepath))
    context = {1: {"title": "", "article": ""}, 2: {"title": "", "article": ""},
               3: {"title": "", "article": ""}}
    current_seg = None
    chunk_idx = 0

    def emit(seg):
        nonlocal chunk_idx
        if not seg or not seg.get("text", "").strip(): return
        for c_idx, chunk_text in enumerate(_sliding_window_split(seg["text"], chunk_size, chunk_size // 5)):
            if not chunk_text.strip(): continue
            yield DocumentChunk(
                doc_id=f"{filepath.name}:c{chunk_idx}", filename=filepath.name,
                file_type="docx", page=1, text=chunk_text,
                metadata={"source": filepath.name, "page": 1,
                          "title": seg.get("title", ""), "article_no": seg.get("article_no", ""),
                          "parent": seg.get("parent", ""), "parent_article": "",
                          "level": seg.get("level", "body"), "subfolder": subfolder,
                          "element_type": seg.get("element_type", "")},
            )
            chunk_idx += 1

    for element in elements:
        elem_type = type(element).__name__
        text = str(element).strip()
        if not text: continue
        is_heading = elem_type in ("Title", "Header")
        lvl = 2 if elem_type == "Title" else (1 if elem_type == "Header" else _detect_level(text))
        if is_heading and lvl:
            if current_seg: yield from emit(current_seg)
            article_no = _extract_article_number(text)
            context[min(lvl, 3)] = {"title": text, "article": article_no}
            parent = context.get(min(lvl - 1, 3), {}).get("title", "") if lvl > 1 else ""
            current_seg = {"level": f"h{lvl}", "title": text, "article_no": article_no,
                           "text": text, "parent": parent, "element_type": elem_type}
        else:
            if current_seg: current_seg["text"] += "\n" + text
            else: current_seg = {"level": "body", "title": "", "article_no": "",
                                  "text": text, "parent": "", "element_type": elem_type}
    if current_seg: yield from emit(current_seg)


def _parse_docx_hierarchical(filepath: Path, subfolder: str = "", chunk_size: int = 800) -> Generator[DocumentChunk, None, None]:
    # Try unstructured for DOCX — works without unstructured_inference
    try:
        from unstructured.partition.docx import partition_docx
        yield from _parse_docx_unstructured(filepath, subfolder, chunk_size)
        return
    except Exception:
        pass
    from docx import Document

    doc = Document(str(filepath))
    logger.info(f"DOCX hierarchisch: {filepath.name}")

    context = {1: "", 2: "", 3: ""}
    current_seg = None
    chunk_idx = 0

    def emit(seg):
        nonlocal chunk_idx
        if not seg or not seg.get("text", "").strip():
            return
        for c_idx, chunk_text in enumerate(_sliding_window_split(seg["text"], chunk_size, chunk_size // 5)):
            if not chunk_text.strip():
                continue
            yield DocumentChunk(
                doc_id=f"{filepath.name}:c{chunk_idx}",
                filename=filepath.name,
                file_type="docx",
                page=1,
                text=chunk_text,
                metadata={
                    "source": filepath.name,
                    "page": 1,
                    "title": seg.get("title", ""),
                    "article_no": seg.get("article_no", ""),
                    "parent": seg.get("parent", ""),
                    "parent_article": "",
                    "level": seg.get("level", "body"),
                    "subfolder": subfolder,
                },
            )
            chunk_idx += 1

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        style = para.style.name if para.style else ""
        heading_level = None
        if "Heading 1" in style or "heading 1" in style:
            heading_level = 1
        elif "Heading 2" in style or "heading 2" in style:
            heading_level = 2
        elif "Heading 3" in style or "heading 3" in style:
            heading_level = 3
        elif _detect_level(text) is not None:
            heading_level = _detect_level(text)

        if heading_level is not None:
            if current_seg:
                yield from emit(current_seg)
            context[min(heading_level, 3)] = text
            for deeper in range(min(heading_level, 3) + 1, 4):
                context[deeper] = ""
            parent = context.get(min(heading_level - 1, 3), "") if heading_level > 1 else ""
            current_seg = {
                "level": f"h{heading_level}",
                "title": text,
                "article_no": _extract_article_number(text),
                "text": text,
                "parent": parent,
            }
        else:
            if current_seg:
                current_seg["text"] += "\n" + text
            else:
                current_seg = {"level": "body", "title": "", "article_no": "", "text": text, "parent": ""}

    if current_seg:
        yield from emit(current_seg)


# ─────────────────────────────────────────────
# XLSX — Sheet/Zeilen-orientiert
# ─────────────────────────────────────────────

def _parse_xlsx(filepath: Path, subfolder: str = "") -> Generator[DocumentChunk, None, None]:
    import openpyxl
    wb = openpyxl.load_workbook(str(filepath), read_only=True, data_only=True)
    for sheet_idx, sheet_name in enumerate(wb.sheetnames, start=1):
        ws = wb[sheet_name]
        rows = []
        for row in ws.iter_rows(values_only=True):
            cells = [str(c) for c in row if c is not None]
            if cells:
                rows.append(" | ".join(cells))
        full_text = f"[Sheet: {sheet_name}]\n" + "\n".join(rows)
        for c_idx, chunk_text in enumerate(_sliding_window_split(full_text, 800, 160)):
            yield DocumentChunk(
                doc_id=f"{filepath.name}:s{sheet_idx}:c{c_idx}",
                filename=filepath.name,
                file_type="xlsx",
                page=sheet_idx,
                text=chunk_text,
                metadata={
                    "source": filepath.name,
                    "page": sheet_idx,
                    "title": sheet_name,
                    "article_no": "",
                    "parent": "",
                    "parent_article": "",
                    "level": "sheet",
                    "subfolder": subfolder,
                },
            )
    wb.close()


# ─────────────────────────────────────────────
# Haupt-Entry-Point
# ─────────────────────────────────────────────

def iter_chunks(folder: str, chunk_size: int = 800) -> Generator[DocumentChunk, None, None]:
    """
    Walk folder, parse each file with hierarchical chunking.
    chunk_size: Zielgröße pro Chunk in Zeichen (Standard 800)
    """
    folder_path = Path(folder)
    if not folder_path.exists():
        logger.warning(f"Folder not found: {folder}")
        return

    for filepath in sorted(folder_path.rglob("*")):
        if filepath.is_dir():
            continue
        suffix = filepath.suffix.lower()
        try:
            rel = filepath.relative_to(folder_path)
            subfolder = str(rel.parent) if str(rel.parent) != "." else ""
            if suffix == ".pdf":
                yield from _parse_pdf_hierarchical(filepath, subfolder, chunk_size)
            elif suffix in (".docx", ".doc"):
                yield from _parse_docx_hierarchical(filepath, subfolder, chunk_size)
            elif suffix in (".xlsx", ".xls"):
                yield from _parse_xlsx(filepath, subfolder)
            else:
                logger.debug(f"Skipping: {filepath.name}")
        except Exception as e:
            logger.error(f"Failed to parse {filepath.name}: {e}")


# ─────────────────────────────────────────────
# File listing
# ─────────────────────────────────────────────

def list_files(folder: str) -> list[dict]:
    folder_path = Path(folder)
    result = []
    if not folder_path.exists():
        return result
    for filepath in sorted(folder_path.rglob("*")):
        if filepath.is_dir():
            continue
        suffix = filepath.suffix.lower()
        if suffix not in (".pdf", ".docx", ".doc", ".xlsx", ".xls"):
            continue
        result.append({
            "name": filepath.name,
            "type": suffix.lstrip("."),
            "size_kb": filepath.stat().st_size // 1024,
            "path": str(filepath),
        })
    return result