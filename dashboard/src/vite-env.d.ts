/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" (Standard) oder "backend" */
  readonly VITE_AI_MODE?: string
  /** z. B. http://localhost:8000 – leer lassen, wenn der Vite-Proxy genutzt wird */
  readonly VITE_API_BASE_URL?: string
  /** Bei Backend-Fehlern auf Simulation ausweichen (Standard: true) */
  readonly VITE_AI_FALLBACK?: string
  /** Timeout pro Anfrage in Millisekunden (Standard: 60000) */
  readonly VITE_API_TIMEOUT_MS?: string
  /** Ziel für den Vite-Dev-Proxy /api (nur vite.config.ts) */
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
