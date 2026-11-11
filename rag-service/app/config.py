"""Configuration — loaded from rag-service/.env (python-dotenv) or the process environment."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", override=True)  # .env wins over inherited shell variables

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# "local"  -> Chroma default ONNX MiniLM (English, no key, ~80 MB one-time download)
# "google" -> gemini-embedding-2 (free tier, needs GOOGLE_API_KEY)
# "hip"    -> JAIF workshop gateway, embeddinggemma-2 (768 dims, needs HIP_API_KEY)
# "openai" -> text-embedding-3-small (needs OPENAI_API_KEY with balance)
EMBEDDING_BACKEND = os.getenv("EMBEDDING_BACKEND", "local").strip().lower()
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")  # openai backend
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_EMBED_MODEL = os.getenv("GOOGLE_EMBED_MODEL", "gemini-embedding-2")  # google backend
GOOGLE_EMBED_DIM = int(os.getenv("GOOGLE_EMBED_DIM", "3072"))  # model native size; 128-3072 allowed

# JAIF / hessian.AI workshop gateway (OpenAI-compatible). Team key, EU-hosted models.
HIP_API_KEY = os.getenv("HIP_API_KEY", "")
HIP_BASE_URL = os.getenv("HIP_BASE_URL", "https://hip-gw.hessian.ai/v1")
HIP_EMBED_MODEL = os.getenv("HIP_EMBED_MODEL", "google-embeddinggemma/embeddinggemma-2")
HIP_LLM_MODEL = os.getenv("HIP_LLM_MODEL", "GLM-5.3-Flash")

# "claude" -> Anthropic API with structured outputs; "hip" -> gateway chat completions + JSON validated by Pydantic
LLM_BACKEND = os.getenv("LLM_BACKEND", "claude").strip().lower()
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5-5")

DATA_DIR = ROOT / "data"
CHROMA_PATH = str(DATA_DIR / "chroma")
UPLOAD_DIR = DATA_DIR / "uploads"
# One collection per embedding backend: vector dimensions differ (1536 vs 384).
COLLECTION = f"knowledge_{EMBEDDING_BACKEND}"

PORT = int(os.getenv("PORT", "8001"))
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
