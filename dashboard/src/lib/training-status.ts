import type { Employee, LearningModule } from '@/types'

export type TrainingStatus = 'abgeschlossen' | 'in_bearbeitung' | 'nicht_begonnen'

/**
 * Demo-Heuristik: Der Trainingsstatus wird deterministisch aus `knowledgeCoverage`
 * abgeleitet (es gibt noch keine echten Trainingsdaten pro Person).
 * Pflichttrainings = Module, deren `targetRoles` die Rolle der Person enthalten.
 */
export function trainingStatusOf(e: Employee, modules: LearningModule[]): { status: TrainingStatus; percent: number; required: LearningModule[] } {
  const required = modules.filter((m) => m.targetRoles.includes(e.jobRole))
  if (e.knowledgeCoverage >= 85) return { status: 'abgeschlossen', percent: 100, required }
  if (e.knowledgeCoverage >= 45) return { status: 'in_bearbeitung', percent: e.knowledgeCoverage, required }
  return { status: 'nicht_begonnen', percent: 0, required }
}
