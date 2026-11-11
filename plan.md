# Knowledge Transfer - RAG block plan

FUTURY Build Days #4 (LBS / Helaba), Frankfurt, 2026-11-11/12.
Team sketch: Input -> Transformation -> Output, four people: Interview Interface, RAG (this block), Media Interface, Design.
Code submission 2026-11-12 13:00, pitch slides 2026-11-12 15:00. Everything in English.

## 1. What we are building

A time-aware knowledge base that turns expert interviews and existing documents into verified, citable training material.

- Input: documents (circulars, amendments, manuals as PDF/DOCX/PPTX/XLSX/MD) and interview facts posted by the Interview Interface.
- Transformation (this block): chunk, embed, store with validity metadata, search with a date, check statements against the knowledge base, keep a human in the loop.
- Output: a structured knowledge package (current rules, historical rules, citations, optional training outline and quiz seeds) for the Media Interface, which produces slides, speaker script and quiz.

The challenge deck asks for exactly this (p.6, p.8, p.10): interview-to-training, time validity (Circular v1 historical -> Amendment -> Circular v2 current), statements flagged as correct / plausible / possibly outdated, live prototype, training package.

## 2. Models and components

| Role | Choice | Why | Verified |
|---|---|---|---|
| LLM (default) | Claude Opus 5.5 (`claude-opus-5-5`, native structured outputs) via `LLM_BACKEND=claude` | Reliable typed JSON for verdicts and training outlines; strongest reasoning on time-validity questions | 16/16 smoke checks pass on the 7-document corpus, 2026-11-11 16:33 |
| LLM (alternative) | `GLM-5.3-Flash` on the JAIF hIP gateway (`LLM_BACKEND=hip`, OpenAI-compatible, team key, EU-hosted) | Workshop infrastructure, EU data residency; JSON validated by Pydantic | 15/16 on the 7-document corpus: slower and the training-outline JSON failed twice in a row, so not used for the demo |
| Embeddings (default) | `gemini-embedding-2` (Google, 3072 dims) via `EMBEDDING_BACKEND=google` | Multilingual (German + English), free tier, fast | 16/16 passed; hIP `embeddinggemma-2` (768 dims) remains available as `EMBEDDING_BACKEND=hip` |
| Embeddings (alternatives) | `google` gemini-embedding-2 (3072, free tier) / `local` Chroma MiniLM (384, offline) | Google = quality; local = no key, no network, keeps the demo alive if wifi fails | Both passed end to end |
| Embeddings (optional) | OpenAI `text-embedding-3-small` | Only if an account with balance exists | Not used (no balance) |
| Vector store | ChromaDB 1.5 (persistent, cosine), one collection per embedding backend | Local file, metadata filters, no server to run | Passed |
| API | FastAPI + uvicorn, port 8001, CORS open | Simple HTTP contract for the two other blocks | Passed |
| Parsing | PyMuPDF, python-docx, python-pptx; chunker reused from a prior regulatory-document project | Hierarchical chunking already handles German regulatory layouts | Passed on demo PDFs |

Note: Anthropic offers no embedding model (official docs state this), which is why embeddings come from Google or the local model.

Data residency (mentor's caution: data must not leave local; Ollama suggested). Today the prototype uses the EU-hosted workshop gateway because we are not inside the bank. All model calls sit behind two switches, `EMBEDDING_BACKEND` and `LLM_BACKEND`, so inside Helaba the same service can point at on-premise models: `EMBEDDING_BACKEND=local` already keeps every vector on the machine (verified), and the LLM switch can target an Ollama or Helaba AI platform endpoint. Known limitation: we measured Ollama `gemma4:e4b` on a laptop CPU (no usable GPU): first call 111 s including 90 s model load, then 8.4 tokens/s, verdict correct. Fine for on-premise with a GPU server, too slow for this live demo. Demo data is synthetic; the free Gemini tier (alternative backend) may use submitted content, so it must not see real documents.

## 3. What kind of RAG

Standard vector RAG with metadata filtering, not GraphRAG.

- Retrieval: embed the question, nearest-neighbour search in Chroma (cosine), filtered by `approved=true` and optionally by origin (document or interview).
- Time validity: every chunk carries `valid_from` / `valid_to` (exclusive). At query time the caller passes `as_of`; each hit is labelled `current`, `possibly_outdated` or `not_yet_valid` for that date. Current hits rank first; historical hits stay visible so the LLM can explain what changed.
- Supersession chain: ingesting Circular v2 with `supersedes=circular-v1` closes v1's validity window at v2's start date and links the two. This is a small explicit version graph, maintained by metadata, not by an LLM.
- Human in the loop: interview facts are stored as drafts and are invisible to normal search and export until a reviewer approves them (`/facts/{id}/approve` or `/reject` with reviewer and note).
- Grounded generation: Claude only sees the retrieved evidence (with validity labels and citations) and returns a typed verdict with the evidence ids it relied on.

Why not GraphRAG: it needs LLM-based entity and relation extraction at ingest time, more cost and more failure modes, and it does not solve the challenge's core problem, which is "what is valid when". Validity metadata plus a supersession link solves that deterministically and is easy to explain to a jury (Transparency, Explainability).

## 4. API contract (http://localhost:8001, interactive docs at /docs)

| Method | Path | Who calls it | Purpose |
|---|---|---|---|
| GET | /health | everyone | backend, models, chunk count |
| POST | /ingest | Design/Admin UI | upload a file + form fields: title, valid_from, doc_id?, doc_type?, version?, valid_to?, supersedes?, owner?, approved?, audience? |
| POST | /ingest/local | scripts | same, for a file already on the machine (`{"path": ..., "meta": {...}}`) |
| GET | /documents | UI | list documents with validity window, supersession and status today |
| DELETE | /documents/{doc_id} | UI | remove a document |
| GET | /search?q=&as_of=&k=&include_historical=&include_unapproved=&origin= | all | validity-labelled semantic search |
| POST | /facts | Interview Interface | `{expert, topic, question, answer, valid_from?, valid_to?, interviewed_at?, tags?, source_hint?}` -> auto-checked against the KB (`kb_verdict` correct / plausible / possibly_outdated / contradicted / unsupported), stored as draft, or as `needs_review` when contradicted; never auto-approved |
| GET | /facts?status=draft\|needs_review\|approved\|rejected | reviewer UI | review queue |
| POST | /facts/{id}/approve?reviewer=&note= | reviewer UI | release a fact into the knowledge base |
| POST | /facts/{id}/reject?reviewer=&note= | reviewer UI | keep it out, with a note |
| POST | /check | Interview Interface / UI | `{statement, as_of?}` -> verdict correct / plausible / possibly_outdated / contradicted / unsupported, explanation, what applies today, evidence with citations |
| GET | /export?topic=&as_of=&audience=&k=&outline=true | Media Interface | `{current[], historical[], sources[], outline?}`; outline = title, objectives, sections with key points and evidence ids, validity notes, quiz seeds |
| POST | /admin/reset | demo | wipe everything |

Every hit carries: id, text, doc_id, title, version, page, section, origin, valid_from, valid_to, validity_status, supersedes, superseded_by, approved, review_status, expert, citation (ready-to-print string).

## 5. Demo data (synthetic, clearly marked as such)

Fictional company: MainBank AG (Frankfurt, corporate lending / SME credit; the leaving expert is Senior Credit Analyst Dr. Petra Hoffmann). 28 documents in `../database/` (11 policy/process/customer documents in English + the same 11 in German as separate `-de` doc_ids, incl. the Credit Policy in two versions v1 2022 -> v2 2025-07-01, + 6 e-mails in EN/DE) and 1 interview file, see its README. Corpus pivot on 2026-11-11 (evening); the previous Nordlicht and Mainfracht corpora are backed up.

- `sop-discount-2023-v1` (PDF from MD): SOP-01 Discount and Pricing Approval v1. AE alone up to 15%, 15-25% Head of Sales by e-mail, above 25% CFO; quote validity 30 days; price list PL-2023. Valid from 2023-01-01.
- `sop-discount-2025-v2` (PDF from MD): supersedes v1 in full. AE alone up to 10%, 10-20% Head of Sales via DISC-APP in the CRM, above 20% Deal Desk with a business case; e-mail/chat/verbal approvals not valid; quote validity 14 days; PL-2025. Valid from 2025-04-01.
- `sop-lead-qual-2024` (MD): SOP-02 MQL to SQL. SDR contact within 2 business days, BANT + fit score >= 60, LQ-FORM mandatory, AE accepts within 3 business days, discovery call within 10.
- `sop-quote-contract-2024` (MD): SOP-03 Quote-to-Contract. Quotes only from CPQ, OF-STD order form, DPA before signature, e-signature only, CS handover within 5 business days via CS-HANDOVER, kickoff within 10.
- `sop-renewal-2025` (MD): SOP-04 Renewal and Expansion. Renewal opportunity 120 days before contract end, 5% uplift, AE owns renewals >= 50,000 EUR ARR, health score < 40 -> churn-risk plan, uplift below 5% counts as a discount (SOP-01).
- `sop-crm-forecast-2024` (MD): SOP-05 CRM Hygiene and Forecast. Update by Friday 12:00, forecast categories, mandatory fields, Monday deal review above 25,000 EUR, stale after 30 days, closed lost after 60.
- 10 e-mails (TXT, 2025-03 to 2026-10): SOP-01 v2 announcement, Hansa 18% request (DISC-APP only), Baltic 28% one-time exception (valid until 2025-08-31), DEMO-REQ rules, DPA template v3, late CS handover for Rheintal Pharma, Q2 forecast rules (close-date moves from 2026-06-01), Cloudstock field notes, Hansa renewal 3% cap vs 5% uplift, Markus Feld departure and handover plan.
- Interviews: Markus Feld (Senior Account Executive, leaving 2026-12-31): correct "DISC-APP only" / possibly_outdated "15% on my own" / unsupported tacit budget-round phone call / contradicted "handover within 10 business days". Tobias Kern (Solutions Engineer, leaving 2027-01-31): DEMO-REQ facts, one tacit pharma demo rule, contradicted "trial 60 days".

Demo story: ask "discount an account executive may grant alone" as of 2024 -> v1 current; as of today -> v2 and the e-mails current, v1 possibly outdated. Check "15% on their own" today -> possibly outdated, with what applies today. Approve an interview fact live, then export the topic "discount approval and quoting process for account executives" for the Media block.

## 6. Status (2026-11-11 16:10)

Decision confirmed with the team: plain RAG, not GraphRAG (section 3).

Verified by `scripts/smoke_test.py` on Google embeddings + Claude Opus 5.5 (7 synthetic documents in `../database/`, 44 chunks, load 96 s, smoke 93 s): time-validity search, supersession, draft/approve flow, all four `/check` verdict cases (possibly_outdated, correct, contradicted, unsupported), export split into current and historical with citations, the training outline, and the automatic KB check on incoming interview facts (undocumented knowledge -> unsupported/draft, conflicting answer -> contradicted/needs_review). 16 of 16 checks pass, server log clean. On the hIP gateway (embeddinggemma-2 + GLM-5.3-Flash) the same suite reached 15/16: the training-outline JSON failed twice, and calls were slower, so hIP was dropped for the demo. The local embedding backend passed earlier minus the LLM checks. Switching backends means re-running `load_demo.py` (one Chroma collection per backend).

Open:
1. Confirm the contract above with the Interview and Media teammates (field names, dates as YYYY-MM-DD).
2. Ask a mentor what the Helaba AI platform offers (models, endpoints) so the pitch can say how the LLM and embedding switches map onto it.
3. Decide demo machine and network. If the Google or Anthropic API is unreachable at the venue: `EMBEDDING_BACKEND=local` (no LLM checks) or `EMBEDDING_BACKEND=hip` + `LLM_BACKEND=hip` (team key needed again). Re-run `load_demo.py` after any switch.
4. Corpus decided (pivot 2026-11-11 evening): MainBank AG SME corporate lending, 28 documents (bilingual EN/DE) + 1 expert interview in `../database/` (see its README). The Nordlicht and Mainfracht corpora are backed up. The service is bilingual: `language` document metadata, `/search?language=`, and a `lang` (en|de) parameter on /facts, /check, /interview/next, /export and /export/video.

Decided against: automatic supersession between interview facts. Interviews do not necessarily repeat a topic, so conflicts between facts stay a reviewer decision (approve / reject with a note).

Will not do: GraphRAG, authentication, multi-tenant setup, server-side retries or model fallbacks, fine-tuning, German-language demo data.

## 7. How to run (from `hackathnhlaba/rag-service/`)

```
python -m venv .venv && .venv\Scripts\pip install -r requirements.txt
copy .env.example .env   (fill in the keys)
python -m uvicorn app.main:app --port 8001
python scripts\make_demo_pdfs.py
python scripts\load_demo.py
python scripts\smoke_test.py
```
