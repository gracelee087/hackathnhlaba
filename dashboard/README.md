# HELABA KNOWLEDGE INTELLIGENCE

AI-powered Enterprise Knowledge & Learning Platform – Hackathon-Frontend (simulierte KI, keine echten Daten).

## Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Produktions-Build nach dist/
npm run typecheck  # optional: TypeScript-Prüfung
```

Voraussetzung: Node.js 20 oder neuer.

## Mit dem Backend verbinden

1. `.env.example` kopieren und in `.env` umbenennen.
2. In `.env` setzen: `VITE_AI_MODE=backend` und `VITE_API_PROXY_TARGET=http://localhost:8000` (Adresse eures Backends).
3. `npm run dev` neu starten.
4. Settings → „Verbindung testen“ (ruft `GET /api/health` auf).

Welche Endpunkte und JSON-Formate euer Backend liefern muss, steht in **`API.md`**.
Ein lauffähiges Beispiel-Backend (Python/FastAPI) liegt in **`backend-beispiel/main.py`**.
Fällt das Backend aus, nutzt das Frontend automatisch die Simulation (`VITE_AI_FALLBACK=true`).

Relevante Dateien: `src/services/api-client.ts` (HTTP-Client), `src/services/http-ai-service.ts`
(Backend-Aufrufe), `src/services/ai-service.ts` (Umschaltung Mock/Backend).

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · shadcn/ui-Komponentenstil (`src/components/ui`) · Lucide React · Recharts · Framer Motion · React Router 7

## Live-Demo in 12 Schritten (Kernidee)

1. **Workforce Board** öffnen: Aktive, Austritte, laufende Interviews, gesichertes Wissen, Ausgeschiedene
2. Karte **Klaus Becker** in die Spalte „Im KI-Interview“ ziehen (oder „KI-Interview starten“)
3. Projekt-Interview: „Demo-Antwort einfügen“ + Senden – die KI fragt nach Ziel, Werkzeugen, Arbeitsschritten, Stolperfallen und Übergabe
4. Plausibilitätsprüfung: Die Aussage zum Prozesshandbuch hat nur 42 % → automatisch zur **Vier-Augen-Prüfung** an die Führungskraft (Markus Klein); übrige Aussagen „Validieren“
5. „Abschließen“ → Karte springt auf „Wissen gesichert“
6. Toast „Erklärvideo für Nachfolge erstellen“ → Content Studio (Format Video, Zielrolle vorausgewählt)
7. „Mit KI generieren“ → „In Learning Academy speichern“
8. Profilmenü oben rechts → **Ansicht wechseln: Tim Weber (neu)**
9. Onboarding-Dashboard zeigt nur die für Tims Rolle relevanten Erklärvideos – inklusive des neuen Videos
10. Video ansehen, Quiz mit mindestens 80 % bestehen
11. Ansicht **Markus Klein (Teamleitung)**: Hinweis im Dashboard → „Vier-Augen-Prüfung“ → Aussage bestätigen/korrigieren/ablehnen; nur eigene Abteilung, Austrittsgrund vertraulich. Ansicht **HR**: Austrittsgründe sichtbar – Matrix unter Settings
12. Zurück zu Sarah: Dashboard und Analytics sind aktualisiert

Alternative Demo: Document Intelligence → historisches Bauspar-Dokument analysieren → Interview → Knowledge Base.

Zurücksetzen: Profilmenü oben rechts → „Demo-Daten zurücksetzen“.

## Architektur

```
src/
  components/   layout, navigation, dashboard, documents, interviews,
                knowledge, learning, assistant, ui
  pages/        eine Datei pro Route
  context/      AppContext.tsx – zentraler State + localStorage-Persistenz
  data/         mock-data.ts – alle Demo-Daten
  services/     ai-service.ts – Interface `AIService` + Mock-Implementierung
  hooks/        useMetrics (abgeleitete KPIs), useDocumentProcessor
  lib/          Domänenlogik (Gültigkeit, Lernlogik, Content, Interview)
  types/        TypeScript-Modelle
```

**Backend anbinden:** Alle Seiten nutzen ausschließlich `aiService` aus `src/services/ai-service.ts`. Für ein echtes Backend eine zweite Implementierung des Interfaces `AIService` (z. B. per `fetch`) schreiben und dort zuweisen. Die Datenmodelle in `src/types` sind bereits API-tauglich.

## Hinweise

- Alle KI-Antworten sind simuliert und als Demo gekennzeichnet.
- Tarifnamen und Rundschreiben sind fiktive Demo-Daten.
- Der Zustand wird im Browser (localStorage, Schlüssel `hki.demo-state`) gespeichert.
