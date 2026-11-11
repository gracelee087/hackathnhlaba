"""Embedding backends. Anthropic has no embedding model (platform.claude.com docs).
Select with EMBEDDING_BACKEND in .env: local | google | openai.
One Chroma collection per backend (knowledge_<backend>) because the vector sizes differ.
"""
from . import config

_local_ef = None
_openai_client = None


def embed_texts(texts: list[str], kind: str = "document") -> list[list[float]]:
    """kind = "document" (chunks being stored) or "query" (search text).
    Only the google backend uses it (asymmetric retrieval prefixes)."""
    if not texts:
        return []
    backend = config.EMBEDDING_BACKEND
    if backend == "local":
        return _embed_local(texts)
    if backend == "google":
        return _embed_google(texts, kind)
    if backend == "hip":
        return _embed_hip(texts)
    if backend == "openai":
        return _embed_openai(texts)
    raise ValueError(f"unknown EMBEDDING_BACKEND={backend!r} (use local | google | hip | openai)")


def describe() -> str:
    """Human-readable model name for /health."""
    if config.EMBEDDING_BACKEND == "local":
        return "chroma-default-minilm (384 dims)"
    if config.EMBEDDING_BACKEND == "google":
        return f"{config.GOOGLE_EMBED_MODEL} ({config.GOOGLE_EMBED_DIM} dims)"
    if config.EMBEDDING_BACKEND == "hip":
        return f"{config.HIP_EMBED_MODEL} via hip gateway (768 dims)"
    return config.EMBED_MODEL


# -- hip: JAIF workshop gateway, OpenAI-compatible /v1/embeddings ------------
_hip_client = None


def _embed_hip(texts: list[str]) -> list[list[float]]:
    global _hip_client
    if not config.HIP_API_KEY:
        raise RuntimeError("HIP_API_KEY is not set in rag-service/.env")
    if _hip_client is None:
        from openai import OpenAI
        _hip_client = OpenAI(base_url=config.HIP_BASE_URL, api_key=config.HIP_API_KEY)
    out: list[list[float]] = []
    for i in range(0, len(texts), 50):
        resp = _hip_client.embeddings.create(model=config.HIP_EMBED_MODEL, input=texts[i:i + 50])
        out.extend(d.embedding for d in resp.data)
    return out


# -- local: Chroma default (all-MiniLM-L6-v2 via ONNX, 384 dims, no key) ----
def _embed_local(texts: list[str]) -> list[list[float]]:
    global _local_ef
    if _local_ef is None:
        from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
        _local_ef = DefaultEmbeddingFunction()
    return [[float(x) for x in v] for v in _local_ef(texts)]


# -- google: Gemini API, gemini-embedding-2 (free tier) ----------------------
GOOGLE_BATCH_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents"


def _embed_google(texts: list[str], kind: str) -> list[list[float]]:
    """gemini-embedding-2 has no task_type field; per the official docs the task goes
    into the text as a prefix: queries 'task: search result | query: ...',
    documents 'title: none | text: ...'."""
    import time
    import requests

    if not config.GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY is not set in rag-service/.env")
    model = config.GOOGLE_EMBED_MODEL
    prefix = "task: search result | query: " if kind == "query" else "title: none | text: "
    out: list[list[float]] = []
    for i in range(0, len(texts), 50):
        reqs = [{"model": f"models/{model}",
                 "content": {"parts": [{"text": prefix + t}]},
                 "outputDimensionality": config.GOOGLE_EMBED_DIM} for t in texts[i:i + 50]]
        for attempt in range(6):
            r = requests.post(GOOGLE_BATCH_URL.format(model=model),
                              headers={"x-goog-api-key": config.GOOGLE_API_KEY},
                              json={"requests": reqs}, timeout=120)
            if r.status_code != 429 or attempt == 5:
                break
            # free-tier per-minute quota: wait and retry (15, 30, 45, 60, 75 s)
            time.sleep(15 * (attempt + 1))
        if r.status_code != 200:
            raise RuntimeError(f"Google embedding error {r.status_code}: {r.text[:300]}")
        out.extend(e["values"] for e in r.json()["embeddings"])
    return out


# -- openai: text-embedding-3-small (needs balance) --------------------------
def _embed_openai(texts: list[str]) -> list[list[float]]:
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=config.OPENAI_API_KEY or None)
    out: list[list[float]] = []
    for i in range(0, len(texts), 100):
        batch = [t.replace("\n", " ") for t in texts[i:i + 100]]
        resp = _openai_client.embeddings.create(model=config.EMBED_MODEL, input=batch)
        out.extend(d.embedding for d in resp.data)
    return out
