# API-Vertrag: Frontend ↔ Backend

Das Frontend ruft im Modus `VITE_AI_MODE=backend` die folgenden Endpunkte auf.
Alle Antworten sind JSON. Die Feldnamen müssen **exakt** so heißen (camelCase),
weil sie direkt in die TypeScript-Typen aus `src/types/index.ts` übernommen werden.

| Methode | Pfad | Zweck |
|---|---|---|
| GET  | `/api/health` | Verbindungstest (Settings → „Verbindung testen“) |
| POST | `/api/documents/analyze` | Dokument analysieren (multipart/form-data) |
| POST | `/api/interviews/reply` | Nächste Rückfrage im Experteninterview |
| POST | `/api/content/generate` | Folien, Video-Szenen, Podcast und Quiz erzeugen |
| POST | `/api/assistant/ask` | Frage an die Wissensbasis beantworten |

Fehler: HTTP-Status ≥ 400, optional `{"detail": "Fehlermeldung"}`.
Ist `VITE_AI_FALLBACK=true`, nutzt das Frontend bei Fehlern automatisch die Simulation.

---

## GET /api/health

**Antwort**
```json
{ "status": "ok" }
```

---

## POST /api/documents/analyze

**Request** – `multipart/form-data`

| Feld | Typ | Pflicht |
|---|---|---|
| `file` | Datei (PDF, DOCX, PPTX, TXT) | nein (fehlt beim Demo-Dokument) |
| `name` | string | ja |
| `type` | `"PDF" \| "DOCX" \| "PPTX" \| "TXT"` | ja |
| `previewText` | string (bei TXT die ersten 6000 Zeichen) | nein |

**Antwort** – `DocumentAnalysis`
```json
{
  "suggestedTitle": "Tarifbedingungen Classic 2004",
  "category": "Tarife",
  "summary": "Das Dokument beschreibt …",
  "topics": ["Bauspartarife", "Bestandsverträge"],
  "keyConcepts": [{ "term": "Guthabenzins", "definition": "…" }],
  "importantDates": [{ "date": "2015-12-31", "label": "Ende Neuabschluss" }],
  "validity": {
    "validFrom": "2004-01-01",
    "validUntil": "2015-12-31",
    "status": "historisch",
    "note": "Historische Regelung …"
  },
  "contradictions": [{ "id": "c1", "text": "…", "severity": "hoch" }],
  "missingKnowledge": ["Anwendung auf Bestandsverträge"],
  "source": {
    "author": "Produktmanagement",
    "department": "LBS Bestandsverwaltung",
    "pages": 12,
    "reference": "TB-C2004",
    "classification": "Intern"
  },
  "confidence": 0.91
}
```

Erlaubte Werte:
- `category`: `Bausparen`, `Tarife`, `Finanzierung`, `Förderung`, `Prozesse`, `Regulatorik`
- `validity.status`: `aktuell`, `pruefung`, `historisch`, `veraltet`
- `severity`: `hoch`, `mittel`
- `source.department`: `LBS Bausparen`, `LBS Bestandsverwaltung`, `Immobilienfinanzierung`, `WIBank Förderung`, `Compliance & Regulatorik`, `Vertrieb & Beratung`
- Datumsangaben: `YYYY-MM-DD`, `validUntil` darf `null` sein
- `confidence`: 0 bis 1

---

## POST /api/interviews/reply

**Request**
```json
{
  "interviewId": "int-abc",
  "employeeId": "e-becker",
  "projectName": "Altvertragsprüfung Tarifgenerationen",
  "step": 1,
  "scriptId": "projekt",
  "expert": { "name": "Klaus Becker", "role": "Senior Spezialist Bauspartarife", "department": "LBS Bestandsverwaltung" },
  "linkedDocumentName": "Tarifbedingungen_Bauspartarif_Classic_2004.pdf",
  "messages": [
    { "role": "ai", "text": "Welche Unterschiede …?", "timestamp": "2026-11-11T13:40:00Z" },
    { "role": "expert", "text": "Bei älteren Verträgen …", "timestamp": "2026-11-11T13:41:00Z" }
  ],
  "missingInfo": [{ "id": "m1", "label": "Relevante Unterschiede", "resolved": false }],
  "topics": [{ "id": "t1", "label": "Unterschiede bei Altverträgen", "done": false }],
  "expertText": "Bei älteren Verträgen …"
}
```

**Antwort** – `InterviewReply`
```json
{
  "reply": "Welche konkreten Tarifgenerationen sind davon betroffen?",
  "extracted": {
    "statement": "Bei Altverträgen gelten die damaligen Tarifbedingungen.",
    "topic": "Unterschiede bei Altverträgen",
    "confidence": 0.86,
    "plausibility": { "score": 42, "reasons": ["Widerspruch zu vorhandenen Dokumenten: …", "Vage Formulierung"] }
  },
  "resolveMissing": ["m1"],
  "topicDone": "t1",
  "contradiction": { "text": "RS 07/2015 nennt …", "severity": "hoch" },
  "resolveContradictions": false,
  "followUp": null,
  "finished": false
}
```
`plausibility.score` (0–100) bewertet die **Aussage** (Deckung durch Dokumente, Konsistenz, Eindeutigkeit) – nicht die Person.
Unter 60 legt das Frontend automatisch eine Vier-Augen-Prüfung für die zuständige Führungskraft an.
Fehlt `plausibility`, gilt die Aussage als unkritisch.

Nur `reply` und `resolveMissing` sind Pflicht. `resolveMissing` und `topicDone` beziehen sich auf die
`id`s aus dem Request.

---

## POST /api/content/generate

**Request**
```json
{
  "format": "praesentation",
  "audience": "Anfänger",
  "difficulty": "Mittel",
  "targetRoles": ["Sachbearbeitung Bestandsverwaltung"],
  "articles": [ { "id": "a-…", "title": "…", "content": ["…"], "validFrom": "…", "validUntil": null, "status": "aktuell" } ]
}
```
`format`: `praesentation`, `video`, `podcast`, `quiz` · `audience`: `Anfänger`, `Fortgeschrittene`, `Experten` ·
`difficulty`: `Leicht`, `Mittel`, `Schwer` · `targetRoles`: Rollen, deren neue Mitarbeitende das Modul im Onboarding-Dashboard sehen

**Antwort** – `GeneratedContent`
```json
{
  "id": "gc-123",
  "format": "praesentation",
  "title": "Bearbeitung historischer Bausparverträge",
  "sourceArticleIds": ["a-…"],
  "audience": "Anfänger",
  "difficulty": "Mittel",
  "createdAt": "2026-11-11T14:00:00Z",
  "learningGoals": ["Grundlagen verstehen: …"],
  "slides": [{ "title": "…", "bullets": ["…"], "notes": "Sprechertext …" }],
  "scenes": [{ "title": "…", "narration": "…", "subtitle": "…", "durationSec": 25 }],
  "podcast": [{ "speaker": "Anna", "text": "…" }, { "speaker": "Klaus", "text": "…" }],
  "quiz": [{ "id": "q1", "question": "…", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "…" }],
  "targetRoles": ["Sachbearbeitung Bestandsverwaltung"]
}
```
Bitte immer **alle** Listen liefern (ggf. leer). Für das Lernmodul werden mindestens 4 Quizfragen empfohlen.
`speaker` ist `Anna` (Moderation) oder `Klaus` (Fachexperte).

---

## POST /api/assistant/ask

**Request**
```json
{ "question": "Welche Besonderheiten gelten bei historischen Bausparverträgen?", "articles": [ { "id": "…", "title": "…" } ] }
```
`articles` enthält die aktuelle Knowledge Base des Frontends. Das Backend kann diese nutzen oder eine eigene Wissensbasis (RAG).

**Antwort** – `AssistantAnswer`
```json
{
  "summary": "Bei historischen Verträgen gelten …",
  "points": [{ "title": "Historische Tarifgenerationen", "text": "…" }],
  "warnings": ["„Tarifbedingungen Generation A“ ist historisch …"],
  "sources": [{ "articleId": "a-tarif-ueberblick", "title": "…", "status": "aktuell", "validFrom": "2016-01-01", "validUntil": null, "relevance": 100 }],
  "documents": ["Tarifhistorie_1990-2024.pptx"],
  "confidence": 84
}
```
`confidence` und `relevance`: 0 bis 100. `articleId` sollte auf einen Artikel aus `articles` zeigen, damit der Link funktioniert.
