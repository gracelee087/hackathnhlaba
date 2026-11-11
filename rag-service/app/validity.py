"""Time validity helpers.

Every chunk carries valid_from / valid_to as YYYYMMDD integers so Chroma can
store them and Python can compare them. valid_to is EXCLUSIVE: a rule valid
"until" 2024-12-31 has valid_to = 20250101. OPEN_END means "still valid".
"""
from datetime import date

OPEN_END = 99991231


def date_to_int(s: str | None) -> int | None:
    if not s:
        return None
    s = s.strip()
    y, m, d = s[:10].split("-")
    return int(y) * 10000 + int(m) * 100 + int(d)


def int_to_date(i: int | None) -> str | None:
    if i is None or i >= OPEN_END:
        return None
    return f"{i // 10000:04d}-{(i // 100) % 100:02d}-{i % 100:02d}"


def today_int() -> int:
    t = date.today()
    return t.year * 10000 + t.month * 100 + t.day


def validity_status(valid_from_i: int, valid_to_i: int, as_of_i: int) -> str:
    """current | possibly_outdated | not_yet_valid, judged at the as_of date."""
    if as_of_i < valid_from_i:
        return "not_yet_valid"
    if as_of_i >= valid_to_i:
        return "possibly_outdated"
    return "current"


def citation(meta: dict) -> str:
    """Human-readable source line: title (version), page, validity window."""
    title = meta.get("title") or meta.get("source") or meta.get("doc_id", "")
    version = meta.get("version", "")
    page = meta.get("page", 0)
    section = meta.get("section", "")
    vf = int_to_date(meta.get("valid_from_i")) or "?"
    vt = int_to_date(meta.get("valid_to_i")) or "open"
    parts = [title + (f" ({version})" if version else "")]
    if section:
        parts.append(section)
    if page:
        parts.append(f"p.{page}")
    parts.append(f"valid {vf} -> {vt}")
    return ", ".join(parts)
