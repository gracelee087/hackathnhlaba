/* ------------------------------------------------------------------
   Lernmodule aus dem Backend (nach KI-Interviews generiert).
   GET /api/learning/modules → LearningModule[] (+ tags, videoUrl, interviewId).
   Fehler werden still geschluckt – die Academy funktioniert auch ohne Backend.
------------------------------------------------------------------- */

import type { KnowledgeArticle, LearningModule } from '@/types'
import { API_BASE_URL } from '@/services/api-client'

const TIMEOUT_MS = 10_000

function isModule(item: unknown): item is LearningModule {
  if (typeof item !== 'object' || item === null) return false
  const m = item as Record<string, unknown>
  return typeof m.id === 'string' && typeof m.title === 'string' && Array.isArray(m.chapters)
}

function isArticle(item: unknown): item is KnowledgeArticle {
  if (typeof item !== 'object' || item === null) return false
  const a = item as Record<string, unknown>
  return typeof a.id === 'string' && typeof a.title === 'string' && Array.isArray(a.content)
}

async function fetchList<T>(path: string, keep: (item: unknown) => item is T): Promise<T[]> {
  if (import.meta.env.VITE_AI_MODE !== 'backend') return []
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json' }, signal: controller.signal })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return []
    return data.filter(keep)
  } catch {
    return []
  } finally {
    window.clearTimeout(timer)
  }
}

export function fetchRemoteModules(): Promise<LearningModule[]> {
  return fetchList('/api/learning/modules', isModule)
}

/** Wissensartikel aus KI-Interviews (ids "iv-<interviewId>", origin "interview", Tag "neu"). */
export function fetchRemoteArticles(): Promise<KnowledgeArticle[]> {
  return fetchList('/api/learning/articles', isArticle)
}
