/* ------------------------------------------------------------------
   Plausibilitätsprüfung von Interview-Aussagen.
   Bewertet wird die AUSSAGE (Deckung durch Dokumente, Konsistenz,
   Eindeutigkeit) – nicht die Person. Unterhalb des Schwellenwerts
   entscheidet die Führungskraft im Vier-Augen-Prinzip.
------------------------------------------------------------------- */
import type { Department, Plausibility } from '@/types'
import { clamp } from '@/lib/utils'

export const REVIEW_THRESHOLD = 60

/** Führungskräfte je Abteilung (Empfänger der Prüfanfragen) */
export const DEPARTMENT_HEADS: Record<Department, string> = {
  'LBS Bestandsverwaltung': 'Markus Klein',
  'LBS Bausparen': 'Dr. Anja Berger',
  Immobilienfinanzierung: 'Oliver Kraus',
  'WIBank Förderung': 'Claudia Neef',
  'Compliance & Regulatorik': 'Dr. Jan Seidel',
  'Vertrieb & Beratung': 'Katrin Horn',
}

const VAGUE = /\b(glaube|eigentlich|vielleicht|ungefähr|ich denke|keine ahnung|weiß nicht|wahrscheinlich|irgendwie|vermutlich)\b/i
const ABSOLUTE = /\b(immer|nie|niemals|alle|jeder|jede|grundsätzlich)\b/i

export function assessPlausibility(text: string, contradiction?: string): Plausibility {
  let score = 91
  const reasons: string[] = []
  if (contradiction) {
    score -= 48
    reasons.push(`Widerspruch zu vorhandenen Dokumenten: ${contradiction}`)
  }
  const vague = text.match(VAGUE)
  if (vague) {
    score -= 22
    reasons.push(`Vage Formulierung („${vague[0]}“) – Aussage nicht eindeutig belegt`)
  }
  if (text.trim().length < 40) {
    score -= 25
    reasons.push('Sehr kurze Antwort ohne nachvollziehbare Begründung')
  }
  if (ABSOLUTE.test(text) && !/\d/.test(text) && !contradiction) {
    score -= 8
    reasons.push('Absolute Aussage ohne konkreten Beleg')
  }
  if (!reasons.length) reasons.push('Konsistent mit vorhandenen Dokumenten und bisherigen Antworten')
  return { score: clamp(Math.round(score), 5, 98), reasons }
}

export function plausibilityMeta(score: number) {
  if (score >= 80) return { label: 'Plausibel', className: 'text-success', bar: 'bg-success', chip: 'border-success/25 bg-success/10 text-success' }
  if (score >= REVIEW_THRESHOLD) return { label: 'Bitte prüfen', className: 'text-warning', bar: 'bg-warning', chip: 'border-warning/30 bg-warning/10 text-warning' }
  return { label: 'Unsicher', className: 'text-danger', bar: 'bg-danger', chip: 'border-danger/25 bg-danger/10 text-danger' }
}
