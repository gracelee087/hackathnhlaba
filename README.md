# Helaba Knowledge Transfer Demo

Hackathon demo (LBS Hessen-Thüringen / Helaba, "Knowledge Transfer" challenge). A retiring expert is interviewed by an AI interviewer; every answer is checked against a time-aware knowledge base (documents with validity dates) and queued for human review. Approved knowledge is exported into training material: a narrated video, a podcast script, slides and a quiz, which show up in a Learning Academy and a management dashboard. All data is synthetic (MainBank AG, corporate lending).

## Architecture

| # | Service | Folder | Stack | Port |
|---|---|---|---|---|
| 1 | RAG / media service | `rag-service/` (this repo) | FastAPI, Chroma, Claude, Piper TTS, ffmpeg | 8001 |
| 2 | Interview backend | `ekep/backend/` in [expert-knowledge-platform](https://github.com/gracelee087/expert-knowledge-platform) | FastAPI, SQLite, OpenAI | 8000 |
| 3 | Interview frontend | `ekep/frontend/` (same repo) | Next.js 15, React 19 | 3000 |
| 4 | Dashboard "Helaba Knowledge Intelligence" | `dashboard/` (this repo) | Vite 6, React 19 | 5173 |

Data flow: frontend 3000 -> backend 8000 -> RAG 8001. The dashboard 5173 proxies `/api/*` to the backend 8000, which in turn calls the RAG service for search, content generation and video rendering. Start them in that order: 8001, 8000, 3000, 5173.

## Prerequisites

- Python 3.11 or 3.12 (tested with 3.11.9; the backend Dockerfile uses 3.12)
- Node.js 20 or newer and npm (tested with Node 22)
- ffmpeg on PATH (video rendering only): https://ffmpeg.org/download.html
- API keys: Anthropic (RAG verdicts, outlines) and OpenAI (interview LLM, and the demo embedding backend). No key is written anywhere in the repos.
- Chrome or Edge for the interview app (browser speech recognition and speech synthesis).

Clone both repos side by side:

```bash
git clone https://github.com/gracelee087/hackathnhlaba.git
git clone https://github.com/gracelee087/expert-knowledge-platform.git
```

## Quickstart

### 1. RAG / media service (port 8001)

```powershell
# Windows PowerShell
cd hackathnhlaba\rag-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # then fill ANTHROPIC_API_KEY and OPENAI_API_KEY, set EMBEDDING_BACKEND=openai
```

```bash
# macOS / Linux
cd hackathnhlaba/rag-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill ANTHROPIC_API_KEY and OPENAI_API_KEY, set EMBEDDING_BACKEND=openai
```

Download the Piper voices (not in git, about 63 MB each). German is required for the demo videos, English is optional:

```bash
mkdir -p data/voices && cd data/voices
curl -L -O https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx
curl -L -O https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json
curl -L -O https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx
curl -L -O https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
cd ../..
```

(PowerShell: `New-Item -ItemType Directory -Force data\voices` then `curl.exe -L -o data\voices\<file> <url>` for each file.)

Start the server, then build the vector store from the documents in `database/` (the store lives in the gitignored `rag-service/data/` and must be built once per clone; takes a few minutes because every interview fact is checked by the LLM):

```bash
python -m uvicorn app.main:app --port 8001        # terminal 1, keep running
python scripts/load_demo.py                       # terminal 2: resets the store, ingests 28 documents + 6 interview facts
python scripts/smoke_test.py                      # optional; re-run load_demo.py afterwards to clear test rows
```

Check: http://localhost:8001/health should report your embedding backend and a non-zero chunk count. Review console: http://localhost:8001/ui

### 2. Interview backend (port 8000)

```powershell
# Windows PowerShell
cd expert-knowledge-platform\ekep\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # fill OPENAI_API_KEY; keep RAG_SERVICE_URL=http://localhost:8001
python -m uvicorn app.main:app --port 8000
```

```bash
# macOS / Linux
cd expert-knowledge-platform/ekep/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill OPENAI_API_KEY; keep RAG_SERVICE_URL=http://localhost:8001
python -m uvicorn app.main:app --port 8000
```

The backend reads `ekep/.env` first, then `ekep/backend/.env` (a `.env.example` exists in both places). SQLite is created automatically under `backend/data/`. Docker alternative: `docker compose up --build` in `ekep/` (see `ekep/README.md`).

### 3. Interview frontend (port 3000)

```bash
cd expert-knowledge-platform/ekep/frontend
npm install
npm run dev
```

No `.env` needed: the API URL defaults to `http://localhost:8000` (override with `NEXT_PUBLIC_API_URL`).

### 4. Dashboard (port 5173)

```bash
cd hackathnhlaba/dashboard
npm install
cp .env.example .env        # PowerShell: copy .env.example .env
```

In `.env` set `VITE_AI_MODE=backend` and `VITE_API_PROXY_TARGET=http://localhost:8000`, then:

```bash
npm run dev
```

With `VITE_AI_MODE=mock` the dashboard runs standalone with simulated AI (no backend needed). `VITE_AI_FALLBACK=true` falls back to the simulation if the backend is down.

## Environment variables (names only)

| Service | Variable | Purpose |
|---|---|---|
| rag-service | `ANTHROPIC_API_KEY` | Claude: statement checks, interview questions, training outlines (`LLM_BACKEND=claude`) |
| rag-service | `OPENAI_API_KEY` | text-embedding-3-small when `EMBEDDING_BACKEND=openai` (demo setting) |
| rag-service | `EMBEDDING_BACKEND` | `openai` (demo), `local` (offline MiniLM, no key, English-centric), `google`, `hip`. One Chroma collection per backend: re-run `load_demo.py` after switching |
| rag-service | `LLM_BACKEND` | `claude` (default) or `hip` |
| rag-service | `GOOGLE_API_KEY`, `HIP_API_KEY` | only for the `google` / `hip` backends |
| rag-service | `PORT` | default 8001 |
| ekep backend | `OPENAI_API_KEY`, `LLM_PROVIDER`, `OPENAI_BASE_URL` | interview, analyst and planner LLM (gpt-4o by default via `INTERVIEWER_MODEL`, `ANALYST_MODEL`, `PLANNER_MODEL`) |
| ekep backend | `RAG_SERVICE_URL`, `RAG_SERVICE_LANG`, `RAG_SERVICE_TOPIC` | link to the RAG service (question proposals, fact submission, dashboard content) |
| ekep backend | `KNOWLEDGE_SEARCH_PROVIDER` | `rag_service` to search the RAG store, `local` for the in-memory seed corpus |
| ekep backend | `VOICE_ENGINE`, `STT_ENGINE`, `TTS_ENGINE` | `browser` needs no extra key; `openai` or `gemini` (`GEMINI_API_KEY`) are server-side |
| ekep backend | `INTERVIEW_LANGUAGE`, `AUDIO_RETENTION`, `PII_REDACTION`, `AUTH_MODE`, `EXPORT_API_KEY`, `CONSENT_TEXT_VERSION`, `EXPORT_INCLUDE_EXPERT_NAME`, `MAX_FOLLOWUPS_PER_TOPIC`, `SEARCH_TOP_K`, `SEARCH_MIN_SCORE`, `LLM_JSON_MODE`, `LLM_MAX_TOKENS` | behaviour switches, defaults in `app/config.py` |
| ekep frontend | `NEXT_PUBLIC_API_URL` | optional, default `http://localhost:8000` |
| dashboard | `VITE_AI_MODE`, `VITE_API_PROXY_TARGET`, `VITE_API_BASE_URL`, `VITE_AI_FALLBACK`, `VITE_API_TIMEOUT_MS` | backend vs. mock mode, proxy target, fallback, timeout |

## Demo walkthrough

| URL | What you see |
|---|---|
| http://localhost:3000 | Interview app: create the expert, generate an interview plan, consent, voice/text interview with live knowledge units, review, export, training preview |
| http://localhost:5173 | Dashboard: Workforce board, AI Content Studio (video, podcast, quiz from the knowledge base), Learning Academy, four-eyes review, analytics |
| http://localhost:8001/docs | RAG API: `/search` with `as_of` date, `/check`, `/facts`, `/export`, `/export/video` |
| http://localhost:8001/ui | Review console for interview facts (approve, reject, supersede) |
| http://localhost:8000/docs | Interview backend API, including `/api/*` used by the dashboard |

Suggested order: interview on :3000, approve the new facts on :8001/ui, then generate a video or podcast in the dashboard's Content Studio on :5173 and open it in the Learning Academy.

## Troubleshooting

- **`ModuleNotFoundError: PIL` when starting the RAG server.** Pillow is listed in `requirements.txt`; if you installed from an older checkout run `pip install pillow piper-tts`.
- **`No module named piper` or `piper voice missing: .../data/voices/de_DE-thorsten-medium.onnx`.** `pip install piper-tts` and download the voice files as shown above into `rag-service/data/voices/`. Only `/export/video` (narrated training video) needs them; search, checks and the podcast script work without.
- **`ffmpeg failed` or `FileNotFoundError: ffmpeg`.** Install ffmpeg and make sure `ffmpeg -version` works in the same shell that runs uvicorn (`rag-service/app/video.py` looks it up on PATH).
- **`/health` shows `chunks: 0`, search returns nothing, interview questions are generic.** The vector store is not in git. Run `python scripts/load_demo.py` with the server up. It needs both API keys; with `EMBEDDING_BACKEND=local` it runs offline for embeddings but still needs `ANTHROPIC_API_KEY` for the fact checks.
- **Switched `EMBEDDING_BACKEND` and everything is empty.** Each backend has its own Chroma collection. Re-run `load_demo.py`.
- **Video frames use a fallback font on macOS/Linux.** `rag-service/app/frames.py` reads Segoe UI / Arial from `C:\Windows\Fonts`; elsewhere it falls back to Pillow's default font. Videos still render.
- **Motion-graphics video style fails.** `style=motion` on `/export/video` needs Node and `npx hyperframes@0.7.54`. The default `style=still` needs only ffmpeg.
- **Dashboard shows simulated data.** Set `VITE_AI_MODE=backend` in `dashboard/.env` and restart `npm run dev`; check Settings -> "Verbindung testen" (calls `GET /api/health` on the backend). The backend returns deterministic fallbacks when the RAG service is down.
- **Microphone does not work in the interview app.** Use Chrome or Edge on `localhost` (secure context). `VOICE_ENGINE=browser` uses the browser's own speech services.
- **Backend `.env` changes have no effect.** `ekep/.env` takes precedence over `ekep/backend/.env` and both override shell variables.
