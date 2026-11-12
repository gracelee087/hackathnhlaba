/* ------------------------------------------------------------------
   Rollen & Berechtigungen (RBAC).
   In Produktion kämen Rollen aus dem Identity Management (z. B. SSO),
   die Prüfung erfolgt zusätzlich serverseitig.
------------------------------------------------------------------- */
import type { AppRole, EmployeeStatus, ExitReason, JobRole, User } from '@/types'

export type Permission =
  | 'board.view'
  | 'board.allDepartments'
  | 'board.exitDetails'
  | 'board.edit'
  | 'interview.conduct'
  | 'content.create'
  | 'documents.manage'
  | 'analytics.view'
  | 'learning.all'
  | 'kb.view'
  | 'review.decide'

export const PERMISSION_LABELS: Record<Permission, string> = {
  'board.view': 'Workforce-Board ansehen',
  'board.allDepartments': 'Alle Abteilungen sehen',
  'board.exitDetails': 'Austrittsgrund einsehen (vertraulich)',
  'board.edit': 'Status von Mitarbeitenden ändern',
  'interview.conduct': 'KI-Interviews führen',
  'content.create': 'Erklärvideos & Lernmodule erstellen',
  'documents.manage': 'Dokumente hochladen & analysieren',
  'analytics.view': 'Analytics ansehen',
  'learning.all': 'Alle Lernmodule sehen',
  'kb.view': 'Knowledge Base lesen',
  'review.decide': 'Aussagen im Vier-Augen-Prinzip prüfen',
}

export const ROLE_LABELS: Record<AppRole, string> = {
  knowledge_manager: 'Knowledge Manager',
  hr: 'HR / Personal',
  teamleitung: 'Teamleitung',
  neu: 'Neue:r Mitarbeiter:in',
}

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  knowledge_manager: [
    'board.view', 'board.allDepartments', 'board.exitDetails', 'board.edit', 'interview.conduct',
    'content.create', 'documents.manage', 'analytics.view', 'learning.all', 'kb.view', 'review.decide',
  ],
  hr: ['board.view', 'board.allDepartments', 'board.exitDetails', 'board.edit', 'analytics.view', 'learning.all', 'kb.view'],
  teamleitung: ['board.view', 'board.edit', 'interview.conduct', 'content.create', 'learning.all', 'kb.view', 'review.decide'],
  neu: ['kb.view'],
}

export function can(user: User, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.appRole].includes(permission)
}

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[]

export const JOB_ROLES: JobRole[] = [
  'Sachbearbeitung Bestandsverwaltung',
  'Bausparberatung',
  'Kreditanalyse',
  'Förderberatung',
  'Compliance',
  'Teamleitung',
  'Personal (HR)',
  'Knowledge Management',
]

export const EMPLOYEE_STATUS_META: Record<EmployeeStatus, { label: string; description: string; dot: string; header: string }> = {
  aktiv: { label: 'Aktiv tätig', description: 'Derzeit bei der Helaba beschäftigt', dot: 'bg-success', header: 'border-t-success' },
  austritt_geplant: { label: 'Interview geplant', description: 'Anlass erkannt – passender KI-Agent zugeordnet', dot: 'bg-warning', header: 'border-t-warning' },
  interview: { label: 'Im KI-Interview', description: 'Projektwissen wird erfasst', dot: 'bg-brand', header: 'border-t-brand' },
  wissen_gesichert: { label: 'Wissen gesichert', description: 'Erklärvideos für die Nachfolge verfügbar', dot: 'bg-navy-800', header: 'border-t-navy-800' },
  ausgeschieden: { label: 'Ausgeschieden', description: 'Nicht mehr im Unternehmen', dot: 'bg-slate-400', header: 'border-t-slate-400' },
}

export const EMPLOYEE_STATUS_ORDER: EmployeeStatus[] = ['aktiv', 'austritt_geplant', 'interview', 'wissen_gesichert', 'ausgeschieden']
/** Spalten im Workforce Board (ohne „Aktiv tätig“) */
export const BOARD_STATUS_ORDER: EmployeeStatus[] = ['austritt_geplant', 'interview', 'wissen_gesichert', 'ausgeschieden']

export const EXIT_REASONS: ExitReason[] = ['Ruhestand', 'Kündigung', 'Interner Wechsel', 'Befristung endet', 'Aufhebungsvertrag']
