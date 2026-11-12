import { hashString } from '@/lib/utils'

export type DateRange = '30d' | '90d' | '12m'

export interface GrowthPoint {
  month: string
  articles: number
  documents: number
  interviews: number
  completion: number
}

export interface SeriesPoint {
  label: string
  articles: number
  documents: number
  interviews: number
  completion: number
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Erzeugt deterministische Zeitreihen für die gewählte Periode. */
export function buildTimeSeries(range: DateRange, growth: GrowthPoint[]): SeriesPoint[] {
  if (range === '12m') {
    return growth.map((g) => ({ label: g.month, ...g }))
  }
  const last = growth[growth.length - 1]
  const startIndex = range === '90d' ? growth.length - 4 : growth.length - 2
  const start = growth[Math.max(0, startIndex)]
  const steps = range === '90d' ? 13 : 30
  const now = new Date()
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1)
    const d = new Date(now)
    if (range === '90d') d.setDate(d.getDate() - (steps - 1 - i) * 7)
    else d.setDate(d.getDate() - (steps - 1 - i))
    const noise = ((hashString(`${range}-${i}`) % 7) - 3) / 100
    const label =
      range === '90d'
        ? `KW ${weekNumber(d)}`
        : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    return {
      label,
      articles: Math.round(lerp(start.articles, last.articles, t) * (1 + noise / 10)),
      documents: Math.round(lerp(start.documents, last.documents, t)),
      interviews: Math.max(0, Math.round(lerp(1, range === '90d' ? 3 : 1.5, t) + noise * 10)),
      completion: Math.round(lerp(start.completion, last.completion, t) + noise * 10),
    }
  }).map((p, i, arr) => (i === arr.length - 1 ? { ...p, articles: last.articles, documents: last.documents, completion: last.completion } : p))
}

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
