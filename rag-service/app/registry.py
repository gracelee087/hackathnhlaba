"""
document_registry.py
Enterprise Document Registry mit SHA256-Fingerprinting.

Jedes Dokument bekommt:
  - document_id (filename + hash)
  - sha256 hash
  - status: pending | indexed | failed
  - metadata: size, pages, chunks, indexed_at

Beim Indexieren:
  - SHA256 berechnen
  - Prüfen ob bereits indexiert (gleicher Hash)
  - Falls ja: SKIP
  - Falls nein: Indexieren + Registry aktualisieren

Gespeichert in: chroma_db/registry.json (neben ChromaDB)
"""

import hashlib
import json
import logging
import os
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

REGISTRY_PATH = Path("chroma_db/registry.json")


def _load() -> dict:
    """Load registry from disk."""
    try:
        if REGISTRY_PATH.exists():
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Registry load error: {e}")
    return {}


def _save(registry: dict):
    """Save registry to disk."""
    try:
        REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Registry save error: {e}")


def sha256_file(filepath: Path) -> str:
    """Compute SHA256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def is_indexed(filepath: Path) -> bool:
    """
    Check if file is already indexed with same content.
    Returns True if file hash matches registry — skip indexing.
    Returns False if new or changed — needs indexing.
    """
    registry = _load()
    key = filepath.name
    if key not in registry:
        return False
    entry = registry[key]
    if entry.get("status") != "indexed":
        return False
    # Compare hash
    try:
        current_hash = sha256_file(filepath)
        if current_hash != entry.get("sha256", ""):
            logger.info(f"Registry: {filepath.name} — Hash geändert, neu indexieren")
            return False
        logger.info(f"Registry: {filepath.name} — bereits indexiert (Hash OK), überspringe")
        return True
    except Exception as e:
        logger.warning(f"Registry hash check failed for {filepath.name}: {e}")
        return False


def mark_indexed(filepath: Path, chunks: int, doc_type: str = "internal"):
    """Mark a file as successfully indexed."""
    registry = _load()
    try:
        file_hash = sha256_file(filepath)
        size_kb = filepath.stat().st_size // 1024
    except Exception:
        file_hash = ""
        size_kb = 0

    registry[filepath.name] = {
        "document_id": f"{filepath.stem}_{file_hash[:8]}",
        "sha256": file_hash,
        "filename": filepath.name,
        "doc_type": doc_type,
        "status": "indexed",
        "chunks": chunks,
        "size_kb": size_kb,
        "indexed_at": datetime.now().isoformat(),
        "path": str(filepath),
    }
    _save(registry)
    logger.info(f"Registry: {filepath.name} markiert als indexiert ({chunks} Chunks)")


def mark_failed(filepath: Path, error: str):
    """Mark a file as failed."""
    registry = _load()
    registry[filepath.name] = {
        "filename": filepath.name,
        "status": "failed",
        "error": str(error),
        "failed_at": datetime.now().isoformat(),
    }
    _save(registry)


def get_all() -> list[dict]:
    """Return all registry entries."""
    return list(_load().values())


def remove_entry(filename: str):
    """Remove a file from registry (e.g. after deletion)."""
    registry = _load()
    if filename in registry:
        del registry[filename]
        _save(registry)
        logger.info(f"Registry: {filename} entfernt")


def clear():
    """Clear entire registry (use when rebuilding from scratch)."""
    _save({})
    logger.info("Registry geleert")


def get_stats() -> dict:
    """Return registry statistics."""
    registry = _load()
    indexed = [v for v in registry.values() if v.get("status") == "indexed"]
    failed = [v for v in registry.values() if v.get("status") == "failed"]
    return {
        "total": len(registry),
        "indexed": len(indexed),
        "failed": len(failed),
        "total_chunks": sum(v.get("chunks", 0) for v in indexed),
    }