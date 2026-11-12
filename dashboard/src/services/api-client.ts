/* ------------------------------------------------------------------
   Schlanker HTTP-Client für das Gruppen-Backend.
   Basis-URL aus .env: VITE_API_BASE_URL (leer = gleicher Host, z. B.
   über den Vite-Proxy "/api" → Backend).
------------------------------------------------------------------- */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 60000)

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal })
    const text = await res.text()
    const data = text ? safeJson(text) : undefined
    if (!res.ok) {
      const detail = typeof data === 'object' && data && 'detail' in data ? String((data as { detail: unknown }).detail) : res.statusText
      throw new ApiError(`Backend-Fehler ${res.status}: ${detail}`, res.status, data)
    }
    return data as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(`Zeitüberschreitung nach ${TIMEOUT_MS / 1000} s (${path})`, 408)
    }
    throw new ApiError(`Backend nicht erreichbar (${BASE_URL || window.location.origin}${path})`, 0)
  } finally {
    window.clearTimeout(timer)
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET', headers: { Accept: 'application/json' } }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    }),
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
}

export const API_BASE_URL = BASE_URL
