# Company Knowledge Base (RAG service)

Time-aware knowledge base for the Knowledge Transfer challenge: documents and interview facts go in, validity-labelled search, statement checks and a training export come out. Overall plan, models and the API contract: see `../plan.md`.

## Run

```
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt     # or: pip install -r requirements.lock.txt (exact versions)
copy .env.example .env                             # fill GOOGLE_API_KEY (embeddings) and ANTHROPIC_API_KEY (check, outline)
python -m uvicorn app.main:app --port 8001
```

Interactive API docs: http://localhost:8001/docs

Demo data (synthetic MainBank AG corporate-lending sources in `../database/`, see its README): the Credit Policy for corporate customers in two versions (v1 2022, v2 from 2025-07-01), the credit processing workflow, the risk assessment checklist, the escalation guidelines, customer profiles and credit case histories for Müller Maschinenbau, Schmidt Logistik and GreenPower Solutions, six e-mails (three English, three German) and the interview facts of the leaving Senior Credit Analyst Dr. Petra Hoffmann. Documents 01-11 exist in English (`credit-policy-2025-v2`, language `en`) and German (`credit-policy-2025-v2-de`, language `de`). Reviewer in the demo UI: Stefan Krüger, Head of Credit Analysis.

```
python scripts\make_demo_pdfs.py     # database/*.md (EN and _DE) -> database/pdf/*.pdf
python scripts\load_demo.py          # reset + ingest 28 documents (11 EN + 11 DE + 6 e-mails) + 6 interview facts (auto-checked)
python scripts\smoke_test.py         # 22 success conditions a-e, s, l
python scripts\export_chroma.py      # database/_chroma_snapshot/chunks.csv (what is in the vector store)
```

## Settings (.env)

| Key | Meaning |
|---|---|
| `EMBEDDING_BACKEND` | `openai` (demo setting: text-embedding-3-small, 1536 dims, multilingual, needs `OPENAI_API_KEY`), `hip` (embeddinggemma-2 on the JAIF gateway, 768 dims, needs `HIP_API_KEY`), `google` (gemini-embedding-2, 3072 dims, needs `GOOGLE_API_KEY`; free tier is capped at 1000 embed requests per day, which one full corpus load plus testing exceeds), `local` (MiniLM, offline, English-centric). One Chroma collection per backend; switching needs a reload. |
| `GOOGLE_EMBED_DIM` | 128-3072, default 3072 |
| `LLM_BACKEND` | `claude` (default, needs `ANTHROPIC_API_KEY`) or `hip` (GLM-5.3-Flash on the JAIF gateway) |
| `CLAUDE_MODEL` | default `claude-opus-5-5` |
| `PORT` | default 8001 |

Each backend writes to its own Chroma collection (`data/chroma`), so switching backends means re-running `load_demo.py`.

## Continuous flow (interview -> knowledge base -> training)

1. Interview Interface posts each captured answer to `POST /facts`. It is embedded and stored immediately (no re-indexing). On arrival the answer is checked against the knowledge base as of today and the result is stored with the fact: `kb_verdict` = correct | plausible | possibly_outdated | contradicted | unsupported. `contradicted` lands in `review_status=needs_review`, everything else in `draft`. `unsupported` = undocumented expert knowledge (a documentation gap). Nothing is approved automatically.
2. A reviewer approves or rejects it (`POST /facts/{id}/approve|reject`). Only approved facts are searchable and exported. Queue: `GET /facts?status=draft|needs_review|approved|rejected`.
3. Media Interface calls `GET /export?topic=...&outline=true` and receives current rules, historical rules, citations and a training outline with quiz seeds, ready for slides, script and video.

## Routes

| Route | Purpose | Language parameters |
|---|---|---|
| `POST /ingest` | Upload a document (pdf/docx/pptx/xlsx/md/txt) with validity metadata as form fields (`title`, `valid_from`, `doc_id`, `doc_type`, `version`, `valid_to`, `supersedes`, `owner`, `department`) | form field `language` = `en` \| `de` (language of the document text, default `en`) |
| `POST /ingest/local` | Ingest a file already on this machine (JSON body `path` + `meta`) | `meta.language` |
| `GET /documents`, `DELETE /documents/{doc_id}` | List documents with validity window and version chain / delete one | - |
| `GET /search` | Semantic search with validity judged at `as_of`; filters `origin`, `department`, `include_historical`, `include_unapproved` | `language=en\|de` returns only chunks written in that language; omitted = both (cross-lingual) |
| `POST /facts` | Interview Interface posts one captured fact (body also takes `expert_role`); stored as draft and auto-checked against the KB. The row carries `delta_type` = `NO_CHANGE` \| `ADD` \| `CONFLICT` \| `SUPERSEDED` \| `UNCLASSIFIED` (`UPDATE` after a supersede approval). An identical answer by the same expert is not stored again: the existing row comes back with `duplicate_of` | body `lang` = `en` \| `de`: language of the answer and of the returned `kb_explanation` |
| `GET /facts?status=...` | Review queue: `draft` \| `needs_review` \| `approved` \| `rejected` | - |
| `POST /facts/{id}/approve`, `POST /facts/{id}/reject` | Human decision (`reviewer`, `note` as query params). Approve also takes `resolution=coexist` (default) \| `supersede`: supersede closes the validity of the cited document chunks (`kb_evidence_ids`) at the fact's `valid_from`, marks them `superseded_by=<fact id>` and sets the fact's `delta_type=UPDATE`; the response lists `superseded_chunks` | - |
| `DELETE /facts/{id}` | Remove one interview fact (duplicates, test entries); document chunks the fact had superseded are reopened (`reopened_chunks`) | - |
| `GET /updates` | Approved interview knowledge written back to `database/_updates/ledger.csv` | - |
| `GET /taxonomy` | Departments with approver, aliases (e.g. `Kreditanalyse` -> `credit_analysis`) and glossary | - |
| `GET /semantic`, `GET /semantic/{concept_key}`, `GET /semantic/unknown-terms` | Concept cards with the value timeline across policy versions; terms the glossary does not explain | - |
| `POST /interview/next` | Propose the next interview question from the KB and the turns so far (reason: opening, gap, contradiction, deepen, handover, closing) | body `lang`: language of the question and rationale |
| `POST /check` | Verdict for a statement as of a date: correct, plausible, possibly_outdated, contradicted, unsupported | body `lang`: language of `explanation` and `what_applies_today` |
| `GET /export` | Knowledge package for training: current vs historical, citations, optional `outline=true` | `lang`: language of the outline and speaker scripts |
| `POST /export/video` | Builds the export outline, narrates it (Piper voice) and renders an MP4; query params `topic`, `as_of`, `audience`, `k`, `department` | `lang` (default `de`): narration language; `style` (default `still`): `still` = one image per scene + ffmpeg (~2-3 min), `motion` = HyperFrames motion graphics (`app/motion.py`, needs Node + `npx hyperframes@0.7.54`, render ≈ 2x realtime, ~4-5 min for a 100 s video) |
| `GET /videos/{job}/{name}` | Serves a rendered training video (MP4) | - |
| `GET /health`, `GET /ui`, `POST /admin/reset` | Status; the review console; delete everything (demo) | - |

## Quick examples

Search with a date (the four-eyes limit was EUR 1.0 million under Credit Policy v1, EUR 1.5 million under v2):

```
curl "http://localhost:8001/search?q=four-eyes%20approval%20limit%20total%20exposure&as_of=2024-06-01&k=5"
curl "http://localhost:8001/search?q=Genehmigungsgrenzen%20Gesamtobligo&language=de&k=5"
```

Post an interview fact (stored as draft until approved):

```
curl -X POST http://localhost:8001/facts -H "Content-Type: application/json" -d "{\"expert\":\"Dr. Petra Hoffmann\",\"topic\":\"SME corporate lending and credit analysis\",\"question\":\"...\",\"answer\":\"...\",\"interviewed_at\":\"2026-11-11\",\"lang\":\"en\"}"
curl -X POST "http://localhost:8001/facts/<fact_id>/approve?reviewer=Stefan%20Kr%C3%BCger&note=verified"
```

Check a statement (German explanation with `"lang":"de"`):

```
curl -X POST http://localhost:8001/check -H "Content-Type: application/json" -d "{\"statement\":\"Together with the relationship manager I can decide up to EUR 1.0 million.\",\"as_of\":\"2026-11-11\",\"lang\":\"en\"}"
```

Export for the Media block (add `&outline=true` for a Claude-generated training outline with quiz seeds, `&lang=de` for German scripts):

```
curl "http://localhost:8001/export?topic=credit%20approval%20limits%20and%20policy%20exceptions%20for%20corporate%20loans&as_of=2026-11-11&audience=beginner"
curl -X POST "http://localhost:8001/export/video?topic=credit%20approval%20limits%20and%20policy%20exceptions%20for%20corporate%20loans&as_of=2026-11-11&lang=de"
```

From JavaScript: `fetch("http://localhost:8001/search?q=...").then(r => r.json())` (CORS is open).

## Validity statuses

| Status | Meaning at `as_of` |
|---|---|
| `current` | valid_from <= as_of < valid_to |
| `possibly_outdated` | valid_to <= as_of (superseded or expired) |
| `not_yet_valid` | as_of < valid_from |

`/check` verdicts: `correct`, `plausible`, `possibly_outdated`, `contradicted`, `unsupported`.

## Delta Engine mapping

How the mentor's component names map to this code:

| Component | Where |
|---|---|
| Interview Agent | `POST /interview/next` (next question grounded in the KB) + the interview app |
| Classification Engine | `semantic.analyze_fact` / `semantic.analyze_document`: department + concept keys per fact / document |
| Delta Engine | `llm.check_statement` at `POST /facts`: `kb_verdict` -> `delta_type` (correct -> `NO_CHANGE`, plausible / unsupported -> `ADD`, contradicted -> `CONFLICT`, possibly_outdated -> `SUPERSEDED`, unchecked -> `UNCLASSIFIED`); identical answers are caught by `content_hash` (`duplicate_of`); plus the app's post-interview reconcile |
| Lifecycle Manager | `POST /facts/{id}/approve` / `reject` (+ `resolution=supersede` -> `delta_type=UPDATE`), the `database/_updates/` ledger (`change_type`, `delta_type` columns), and the document `supersedes` / `superseded_by` chain |

## Layout

```
app/config.py      settings from .env
app/validity.py    date helpers, status, citation string
app/embeddings.py  local | google | openai
app/chunking.py    document parser (reused from a prior regulatory project)
app/registry.py    file hash registry (reused)
app/store.py       Chroma store: ingest, supersession, facts, review, search
app/llm.py         Claude calls (structured outputs)
app/main.py        FastAPI routes
app/video.py       training video: outline -> German script -> Piper voice (tts.py) -> frames (frames.py) -> ffmpeg
../database/       synthetic sources, manifest, interviews, personas
scripts/           make_demo_pdfs, load_demo, smoke_test, export_chroma
```
