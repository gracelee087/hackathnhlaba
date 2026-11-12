"""
Minimales Beispiel-Backend (FastAPI) für HELABA Knowledge Intelligence.
Erfüllt den API-Vertrag aus API.md mit Platzhalter-Logik –
an den markierten Stellen (TODO) euer LLM / RAG einbauen.

Start:
    pip install fastapi uvicorn python-multipart
    uvicorn main:app --reload --port 8000
"""
from datetime import date, datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HELABA Knowledge Intelligence API")

# Nur nötig, wenn das Frontend das Backend direkt (ohne Vite-Proxy) aufruft
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/documents/analyze")
async def analyze_document(
    name: str = Form(...),
    type: str = Form(...),
    previewText: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
) -> dict[str, Any]:
    content = (await file.read()) if file else b""
    # TODO: Text extrahieren (z. B. pypdf / python-docx / python-pptx) und per LLM analysieren
    return {
        "suggestedTitle": name.rsplit(".", 1)[0].replace("_", " "),
        "category": "Prozesse",
        "summary": f"Backend-Analyse von {name} ({len(content)} Bytes).",
        "topics": ["Beispielthema"],
        "keyConcepts": [{"term": "Beispielbegriff", "definition": "Vom Backend erkannt."}],
        "importantDates": [{"date": date.today().isoformat(), "label": "Analyse durchgeführt"}],
        "validity": {"validFrom": date.today().isoformat(), "validUntil": None, "status": "pruefung", "note": "Bitte fachlich freigeben."},
        "contradictions": [],
        "missingKnowledge": ["Verantwortliche Fachabteilung bestätigen"],
        "source": {"author": "Upload", "department": "LBS Bausparen", "pages": 1, "reference": name, "classification": "Intern"},
        "confidence": 0.8,
    }


@app.post("/api/interviews/reply")
def interview_reply(body: dict[str, Any]) -> dict[str, Any]:
    open_items = [m for m in body.get("missingInfo", []) if not m.get("resolved")]
    open_topics = [t for t in body.get("topics", []) if not t.get("done")]
    # TODO: Rückfrage per LLM aus body["messages"] erzeugen
    return {
        "reply": "Danke. Können Sie ein konkretes Beispiel aus der Praxis nennen?",
        "extracted": {
            "statement": body["expertText"][:400],
            "topic": open_topics[0]["label"] if open_topics else "Ergänzung",
            "confidence": 0.85,
        },
        "resolveMissing": [open_items[0]["id"]] if open_items else [],
        "topicDone": open_topics[0]["id"] if open_topics else None,
        "finished": len(open_items) <= 1,
    }


@app.post("/api/content/generate")
def generate_content(body: dict[str, Any]) -> dict[str, Any]:
    articles = body.get("articles", [])
    title = articles[0]["title"] if articles else "Lernmodul"
    # TODO: Folien, Szenen, Podcast und Quiz per LLM erzeugen
    slides = [{"title": a["title"], "bullets": a.get("content", [])[:3], "notes": a.get("description", "")} for a in articles]
    return {
        "id": f"gc-{uuid4().hex[:8]}",
        "format": body["format"],
        "title": title,
        "sourceArticleIds": [a["id"] for a in articles],
        "audience": body["audience"],
        "difficulty": body["difficulty"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "learningGoals": [f"Verstehen: {a['title']}" for a in articles],
        "slides": slides,
        "scenes": [{"title": s["title"], "narration": s["notes"], "subtitle": s["notes"][:140], "durationSec": 25} for s in slides],
        "podcast": [{"speaker": "Anna", "text": f"Heute geht es um {title}."}, {"speaker": "Klaus", "text": "Gerne, legen wir los."}],
        "targetRoles": body.get("targetRoles", []),
        "quiz": [
            {"id": f"q{i}", "question": f"Worum geht es in „{a['title']}“?", "options": [a.get("description", "…"), "Kreditkarten", "Aktienhandel", "Reisekosten"], "correctIndex": 0, "explanation": a.get("description", "")}
            for i, a in enumerate(articles)
        ],
    }


@app.post("/api/assistant/ask")
def ask(body: dict[str, Any]) -> dict[str, Any]:
    question: str = body["question"]
    articles = body.get("articles", [])
    words = [w for w in question.lower().split() if len(w) > 4]
    hits = [a for a in articles if any(w in (a["title"] + " " + " ".join(a.get("content", []))).lower() for w in words)][:3]
    # TODO: echte Suche (Embeddings / RAG) + LLM-Antwort
    return {
        "summary": hits[0]["description"] if hits else "Dazu wurde nichts gefunden.",
        "points": [{"title": a["title"], "text": " ".join(a.get("content", [])[:2])} for a in hits],
        "warnings": [f"„{a['title']}“ ist {a['status']}." for a in hits if a["status"] in ("historisch", "veraltet")],
        "sources": [
            {"articleId": a["id"], "title": a["title"], "status": a["status"], "validFrom": a["validFrom"], "validUntil": a.get("validUntil"), "relevance": 100 - i * 20}
            for i, a in enumerate(hits)
        ],
        "documents": sorted({d for a in hits for d in a.get("sourceDocuments", [])}),
        "confidence": 80 if hits else 30,
    }
