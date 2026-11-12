import type { ValidityStatus, VerificationStatus } from '@/types'
import { formatDate } from '@/lib/utils'

export const STATUS_META: Record<ValidityStatus, { label: string; badge: string; dot: string; hint: string }> = {
  aktuell: {
    label: 'Aktuell',
    badge: 'border-success/25 bg-success/10 text-success',
    dot: 'bg-success',
    hint: 'Aktuell gültige, fachlich verifizierte Regelung.',
  },
  pruefung: {
    label: 'Prüfung erforderlich',
    badge: 'border-warning/30 bg-warning/10 text-warning',
    dot: 'bg-warning',
    hint: 'Inhalt muss fachlich geprüft oder freigegeben werden.',
  },
  historisch: {
    label: 'Historisch',
    badge: 'border-slate-300 bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    hint: 'Gültigkeit abgelaufen – nur noch für Altfälle bzw. Bestandsverträge relevant.',
  },
  veraltet: {
    label: 'Veraltet',
    badge: 'border-danger/25 bg-danger/10 text-danger',
    dot: 'bg-danger',
    hint: 'Durch eine neuere Regelung ersetzt – nicht mehr anwenden.',
  },
}

export const VERIFICATION_META: Record<VerificationStatus, { label: string; className: string }> = {
  verifiziert: { label: 'Verifiziert', className: 'text-success' },
  in_pruefung: { label: 'In Prüfung', className: 'text-warning' },
  ungeprueft: { label: 'Ungeprüft', className: 'text-slate-500' },
}

export const STATUS_ORDER: ValidityStatus[] = ['aktuell', 'pruefung', 'historisch', 'veraltet']

export function validityRange(validFrom: string, validUntil: string | null): string {
  return `${formatDate(validFrom)} – ${validUntil ? formatDate(validUntil) : 'heute'}`
}

export function isHistoric(status: ValidityStatus): boolean {
  return status === 'historisch' || status === 'veraltet'
}
