/* ------------------------------------------------------------------
   Zentrale Demo-Daten. Alle Inhalte sind fiktiv bzw. vereinfacht und
   dienen ausschließlich der Hackathon-Demonstration.
------------------------------------------------------------------- */
import type {
  Activity,
  Category,
  Chapter,
  Conversation,
  Department,
  Document,
  DocumentAnalysis,
  Employee,
  InterviewTrigger,
  Expert,
  ExpertInterview,
  KnowledgeArticle,
  LearningModule,
  LearningProgress,
  QuizQuestion,
  Slide,
  User,
} from '@/types'
import { daysAgo, hoursAgo } from '@/lib/utils'

export const USERS: User[] = [
  { id: 'u-sarah', name: 'Sarah Schneider', role: 'Knowledge Manager', department: 'LBS Bausparen', initials: 'SS', email: 'sarah.schneider@demo.local', appRole: 'knowledge_manager', jobRole: 'Knowledge Management' },
  { id: 'u-lisa', name: 'Lisa Hoffmann', role: 'HR Business Partnerin', department: 'LBS Bestandsverwaltung', initials: 'LH', email: 'lisa.hoffmann@demo.local', appRole: 'hr', jobRole: 'Personal (HR)' },
  { id: 'u-markus', name: 'Markus Klein', role: 'Teamleitung Bestandsverwaltung', department: 'LBS Bestandsverwaltung', initials: 'MK', email: 'markus.klein@demo.local', appRole: 'teamleitung', jobRole: 'Teamleitung' },
  { id: 'u-tim', name: 'Tim Weber', role: 'Sachbearbeitung Bestandsverwaltung (neu)', department: 'LBS Bestandsverwaltung', initials: 'TW', email: 'tim.weber@demo.local', appRole: 'neu', jobRole: 'Sachbearbeitung Bestandsverwaltung' },
]

/** Standard-Nutzerin der Demo (Knowledge Manager) */
export const currentUser: User = USERS[0]

/** Organisationsweite Ausgangswerte – lokale Demo-Aktionen werden hinzuaddiert. */
export const BASELINE = {
  articles: 1284,
  documents: 356,
  expertCoverage: 87,
  modules: 42,
  interviews: 38,
  gaps: 24,
}

export const CATEGORIES: Category[] = ['Bausparen', 'Tarife', 'Finanzierung', 'Förderung', 'Prozesse', 'Regulatorik']

export const DEPARTMENTS: Department[] = [
  'LBS Bausparen',
  'LBS Bestandsverwaltung',
  'Immobilienfinanzierung',
  'WIBank Förderung',
  'Compliance & Regulatorik',
  'Vertrieb & Beratung',
]

/* ------------------------------ Experten ------------------------------ */

export const EXPERTS: Expert[] = [
  { id: 'ex-becker', name: 'Klaus Becker', role: 'Senior Spezialist Bauspartarife', department: 'LBS Bestandsverwaltung', yearsOfService: 31, retirement: '2027-03-31', initials: 'KB', knowledgeCoverage: 27, focus: 'Historische Tarifgenerationen' },
  { id: 'ex-richter', name: 'Frank Richter', role: 'Spezialist Altvertragsbestand', department: 'LBS Bestandsverwaltung', yearsOfService: 30, retirement: '2027-08-31', initials: 'FR', knowledgeCoverage: 29, focus: 'Vertragsübertragungen' },
  { id: 'ex-schulte', name: 'Rainer Schulte', role: 'Senior Kreditanalyst', department: 'Immobilienfinanzierung', yearsOfService: 33, retirement: '2027-04-30', initials: 'RS', knowledgeCoverage: 38, focus: 'Kreditwürdigkeitsprüfung' },
  { id: 'ex-krueger', name: 'Petra Krüger', role: 'Spezialistin Wohnraumförderung', department: 'WIBank Förderung', yearsOfService: 24, retirement: '2027-09-30', initials: 'PK', knowledgeCoverage: 41, focus: 'Förderprogramme Hessen' },
  { id: 'ex-wolf', name: 'Jürgen Wolf', role: 'Senior Berater Immobilienfinanzierung', department: 'Immobilienfinanzierung', yearsOfService: 29, retirement: '2027-12-31', initials: 'JW', knowledgeCoverage: 49, focus: 'Kombifinanzierungen' },
  { id: 'ex-brandt', name: 'Michael Brandt', role: 'Sachbearbeiter Zuteilung', department: 'LBS Bestandsverwaltung', yearsOfService: 26, retirement: '2027-11-30', initials: 'MB', knowledgeCoverage: 55, focus: 'Zuteilungsverfahren' },
  { id: 'ex-yilmaz', name: 'Dr. Thomas Yilmaz', role: 'Referent Regulatorik', department: 'Compliance & Regulatorik', yearsOfService: 19, retirement: '2028-01-31', initials: 'TY', knowledgeCoverage: 58, focus: 'Wohnimmobilienkreditrichtlinie' },
  { id: 'ex-hofmann', name: 'Birgit Hofmann', role: 'Compliance-Beauftragte', department: 'Compliance & Regulatorik', yearsOfService: 23, retirement: '2028-09-30', initials: 'BH', knowledgeCoverage: 61, focus: 'Dokumentationspflichten' },
  { id: 'ex-lorenz', name: 'Sabine Lorenz', role: 'Prozessmanagerin Beratung', department: 'Vertrieb & Beratung', yearsOfService: 22, retirement: '2028-03-31', initials: 'SL', knowledgeCoverage: 63, focus: 'Beratungsprozesse' },
  { id: 'ex-vogel', name: 'Andrea Vogel', role: 'Referentin Förderkredite', department: 'WIBank Förderung', yearsOfService: 21, retirement: '2028-06-30', initials: 'AV', knowledgeCoverage: 67, focus: 'Förderkredite' },
  { id: 'ex-neumann', name: 'Elke Neumann', role: 'Teamleiterin Kundenservice', department: 'LBS Bausparen', yearsOfService: 25, retirement: '2028-02-29', initials: 'EN', knowledgeCoverage: 70, focus: 'Kundenanliegen Bausparen' },
  { id: 'ex-hartmann', name: 'Monika Hartmann', role: 'Teamleiterin Zuteilung & Darlehen', department: 'LBS Bausparen', yearsOfService: 27, retirement: '2027-06-30', initials: 'MH', knowledgeCoverage: 72, focus: 'Zuteilung & Bewertungszahl' },
]


/* --------------------------- Mitarbeitende --------------------------- */

const P = (name: string, description: string) => ({ name, description })

export const SEED_EMPLOYEES: Employee[] = [
  // Interview geplant
  { id: 'e-becker', name: 'Klaus Becker', initials: 'KB', title: 'Senior Spezialist Bauspartarife', jobRole: 'Sachbearbeitung Bestandsverwaltung', department: 'LBS Bestandsverwaltung', since: '1995-04-01', yearsOfService: 31, status: 'austritt_geplant', exitDate: '2027-03-31', exitReason: 'Ruhestand', knowledgeCoverage: 27, criticality: 'hoch', projects: [P('Altvertragsprüfung Tarifgenerationen', 'Prüfmatrix und Checkliste für Verträge der Generationen A und Classic 2004'), P('Tarifumstellung 2016', 'Migration der Classic-Bestände in den Vario-Tarif')], successorRole: 'Sachbearbeitung Bestandsverwaltung', moduleIds: [] },
  { id: 'e-richter', name: 'Frank Richter', initials: 'FR', title: 'Spezialist Altvertragsbestand', jobRole: 'Sachbearbeitung Bestandsverwaltung', department: 'LBS Bestandsverwaltung', since: '1996-09-01', yearsOfService: 30, status: 'austritt_geplant', exitDate: '2027-08-31', exitReason: 'Ruhestand', knowledgeCoverage: 29, criticality: 'hoch', projects: [P('Vertragsübertragungen', 'Prozess für Übertragungen von Bausparverträgen an Angehörige')], successorRole: 'Sachbearbeitung Bestandsverwaltung', moduleIds: [] },
  { id: 'e-schulte', name: 'Rainer Schulte', initials: 'RS', title: 'Senior Kreditanalyst', jobRole: 'Kreditanalyse', department: 'Immobilienfinanzierung', since: '1993-01-01', yearsOfService: 33, status: 'austritt_geplant', exitDate: '2027-04-30', exitReason: 'Ruhestand', knowledgeCoverage: 38, criticality: 'hoch', projects: [P('Scoring-Modell Baufinanzierung', 'Regelwerk zur Kreditwürdigkeitsprüfung privater Kunden')], successorRole: 'Kreditanalyse', moduleIds: [] },
  { id: 'e-krueger', name: 'Petra Krüger', initials: 'PK', title: 'Spezialistin Wohnraumförderung', jobRole: 'Förderberatung', department: 'WIBank Förderung', since: '2002-03-01', yearsOfService: 24, status: 'austritt_geplant', knowledgeCoverage: 41, criticality: 'hoch', projects: [P('Förderlotse Hessen', 'Beratungsleitfaden für Landesförderprogramme')], successorRole: 'Förderberatung', moduleIds: [] },
  { id: 'e-wolf', name: 'Jürgen Wolf', initials: 'JW', title: 'Senior Berater Immobilienfinanzierung', jobRole: 'Bausparberatung', department: 'Immobilienfinanzierung', since: '1997-06-01', yearsOfService: 29, status: 'austritt_geplant', knowledgeCoverage: 49, criticality: 'mittel', projects: [P('Kombifinanzierung', 'Rechner und Gesprächsleitfaden für Bauspar-Kombikredite')], successorRole: 'Bausparberatung', moduleIds: [] },
  { id: 'e-brandt', name: 'Michael Brandt', initials: 'MB', title: 'Sachbearbeiter Zuteilung', jobRole: 'Sachbearbeitung Bestandsverwaltung', department: 'LBS Bestandsverwaltung', since: '2000-02-01', yearsOfService: 26, status: 'austritt_geplant', exitDate: '2027-01-31', exitReason: 'Kündigung', knowledgeCoverage: 55, criticality: 'mittel', projects: [P('Zuteilungsplanung', 'Monatliche Planung der Zuteilungsmasse')], successorRole: 'Sachbearbeitung Bestandsverwaltung', moduleIds: [] },
  { id: 'e-yilmaz', name: 'Dr. Thomas Yilmaz', initials: 'TY', title: 'Referent Regulatorik', jobRole: 'Compliance', department: 'Compliance & Regulatorik', since: '2007-05-01', yearsOfService: 19, status: 'austritt_geplant', exitDate: '2027-02-28', exitReason: 'Interner Wechsel', knowledgeCoverage: 58, criticality: 'hoch', projects: [P('WIKR-Umsetzung', 'Einführung der Prüf- und Dokumentationspflichten')], successorRole: 'Compliance', moduleIds: [] },
  { id: 'e-lorenz', name: 'Sabine Lorenz', initials: 'SL', title: 'Prozessmanagerin Beratung', jobRole: 'Bausparberatung', department: 'Vertrieb & Beratung', since: '2004-08-01', yearsOfService: 22, status: 'austritt_geplant', exitDate: '2027-06-30', exitReason: 'Aufhebungsvertrag', knowledgeCoverage: 63, criticality: 'mittel', projects: [P('Beratungsleitfaden 2024', 'Digitales Beratungsprotokoll und Freigabeprozess')], successorRole: 'Bausparberatung', moduleIds: [] },
  { id: 'e-vogel', name: 'Andrea Vogel', initials: 'AV', title: 'Referentin Förderkredite', jobRole: 'Förderberatung', department: 'WIBank Förderung', since: '2024-01-01', yearsOfService: 2, status: 'austritt_geplant', exitDate: '2026-12-31', exitReason: 'Befristung endet', knowledgeCoverage: 67, criticality: 'niedrig', projects: [P('Antragsprüfung Förderkredite', 'Checkliste für die Vorprüfung von Förderanträgen')], successorRole: 'Förderberatung', moduleIds: [] },
  { id: 'e-lang', name: 'Peter Lang', initials: 'PL', title: 'Spezialist Bausparkassenrecht', jobRole: 'Compliance', department: 'Compliance & Regulatorik', since: '1998-10-01', yearsOfService: 28, status: 'austritt_geplant', exitDate: '2027-05-31', exitReason: 'Ruhestand', knowledgeCoverage: 44, criticality: 'hoch', projects: [P('Kündigungsfälle nach BGH 2017', 'Prüfprozess und Textbausteine für Kündigungen')], successorRole: 'Compliance', moduleIds: [] },
  // Im Interview
  { id: 'e-hofmann', name: 'Birgit Hofmann', initials: 'BH', title: 'Compliance-Beauftragte', jobRole: 'Compliance', department: 'Compliance & Regulatorik', since: '2003-04-01', yearsOfService: 23, status: 'interview', exitDate: '2027-01-31', exitReason: 'Ruhestand', knowledgeCoverage: 61, criticality: 'hoch', projects: [P('Dokumentationspflichten', 'Prüfpfad für Beratungsdokumentation')], successorRole: 'Compliance', moduleIds: [] },
  { id: 'e-roth', name: 'Stefan Roth', initials: 'SR', title: 'Spezialist Darlehensauszahlung', jobRole: 'Sachbearbeitung Bestandsverwaltung', department: 'LBS Bestandsverwaltung', since: '1999-07-01', yearsOfService: 27, status: 'interview', exitDate: '2026-12-31', exitReason: 'Ruhestand', knowledgeCoverage: 52, criticality: 'mittel', projects: [P('Auszahlungsprozess Bauspardarlehen', 'Ablauf von Zuteilung bis Auszahlung inkl. Sonderfällen')], successorRole: 'Sachbearbeitung Bestandsverwaltung', moduleIds: [] },
  // Wissen gesichert
  { id: 'e-hartmann', name: 'Monika Hartmann', initials: 'MH', title: 'Teamleiterin Zuteilung & Darlehen', jobRole: 'Sachbearbeitung Bestandsverwaltung', department: 'LBS Bausparen', since: '1999-01-01', yearsOfService: 27, status: 'wissen_gesichert', exitDate: '2027-06-30', exitReason: 'Ruhestand', knowledgeCoverage: 92, criticality: 'hoch', projects: [P('Zuteilungsprozess & Bewertungszahl', 'Regeln und Sonderfälle der Zuteilung')], successorRole: 'Sachbearbeitung Bestandsverwaltung', interviewId: 'i-hartmann', moduleIds: ['m-grundlagen'] },
  { id: 'e-neumann', name: 'Elke Neumann', initials: 'EN', title: 'Teamleiterin Kundenservice', jobRole: 'Bausparberatung', department: 'LBS Bausparen', since: '2001-05-01', yearsOfService: 25, status: 'wissen_gesichert', exitDate: '2027-02-28', exitReason: 'Ruhestand', knowledgeCoverage: 88, criticality: 'mittel', projects: [P('Kundenanliegen Bausparen', 'Antwortbausteine für häufige Kundenfragen')], successorRole: 'Bausparberatung', moduleIds: ['m-grundlagen'] },
  // Ausgeschieden
  { id: 'e-albrecht', name: 'Heinz Albrecht', initials: 'HA', title: 'Spezialist Tarifhistorie', jobRole: 'Sachbearbeitung Bestandsverwaltung', department: 'LBS Bestandsverwaltung', since: '1988-01-01', yearsOfService: 38, status: 'ausgeschieden', exitDate: '2026-09-30', exitReason: 'Ruhestand', knowledgeCoverage: 95, criticality: 'hoch', projects: [P('Tarifhistorie 1990–2024', 'Dokumentation aller Tarifgenerationen')], successorRole: 'Sachbearbeitung Bestandsverwaltung', moduleIds: ['m-tarife'] },
  { id: 'e-maurer', name: 'Gisela Maurer', initials: 'GM', title: 'Sachbearbeiterin Wohnungsbauprämie', jobRole: 'Förderberatung', department: 'WIBank Förderung', since: '1992-03-01', yearsOfService: 34, status: 'ausgeschieden', exitDate: '2026-08-31', exitReason: 'Ruhestand', knowledgeCoverage: 18, criticality: 'hoch', projects: [P('Prämienanträge', 'Bearbeitung der Wohnungsbauprämie')], successorRole: 'Förderberatung', moduleIds: [] },
  // Aktiv
  { id: 'e-klein', name: 'Markus Klein', initials: 'MK', title: 'Teamleitung Bestandsverwaltung', jobRole: 'Teamleitung', department: 'LBS Bestandsverwaltung', since: '2012-04-01', yearsOfService: 14, status: 'aktiv', knowledgeCoverage: 74, criticality: 'mittel', projects: [P('Teamsteuerung Bestand', 'Kapazitätsplanung und Qualitätssicherung')], moduleIds: [] },
  { id: 'e-schneider', name: 'Sarah Schneider', initials: 'SS', title: 'Knowledge Manager', jobRole: 'Knowledge Management', department: 'LBS Bausparen', since: '2019-09-01', yearsOfService: 7, status: 'aktiv', knowledgeCoverage: 90, criticality: 'niedrig', projects: [P('Knowledge Intelligence', 'Aufbau der zentralen Wissensplattform')], moduleIds: [] },
  { id: 'e-hoffmann', name: 'Lisa Hoffmann', initials: 'LH', title: 'HR Business Partnerin', jobRole: 'Personal (HR)', department: 'LBS Bestandsverwaltung', since: '2016-02-01', yearsOfService: 10, status: 'aktiv', knowledgeCoverage: 85, criticality: 'niedrig', projects: [P('Nachfolgeplanung', 'Übersicht über Austritte und Nachbesetzungen')], moduleIds: [] },
  { id: 'e-fischer', name: 'Daniel Fischer', initials: 'DF', title: 'Kreditanalyst', jobRole: 'Kreditanalyse', department: 'Immobilienfinanzierung', since: '2018-07-01', yearsOfService: 8, status: 'aktiv', knowledgeCoverage: 70, criticality: 'niedrig', projects: [P('Objektbewertung', 'Standardisierte Bewertung von Wohnimmobilien')], moduleIds: [] },
  { id: 'e-schmitt', name: 'Nina Schmitt', initials: 'NS', title: 'Bausparberaterin', jobRole: 'Bausparberatung', department: 'Vertrieb & Beratung', since: '2020-03-01', yearsOfService: 6, status: 'aktiv', knowledgeCoverage: 76, criticality: 'niedrig', projects: [P('Digitale Beratung', 'Videoberatung für Bausparkunden')], moduleIds: [] },
  { id: 'e-weber', name: 'Tim Weber', initials: 'TW', title: 'Sachbearbeiter Bestandsverwaltung', jobRole: 'Sachbearbeitung Bestandsverwaltung', department: 'LBS Bestandsverwaltung', since: '2026-11-01', yearsOfService: 0, status: 'aktiv', knowledgeCoverage: 0, criticality: 'niedrig', projects: [], moduleIds: [], isNewHire: true },
  { id: 'e-wagner', name: 'Julia Wagner', initials: 'JW', title: 'Bausparberaterin', jobRole: 'Bausparberatung', department: 'Vertrieb & Beratung', since: '2026-10-15', yearsOfService: 0, status: 'aktiv', knowledgeCoverage: 0, criticality: 'niedrig', projects: [], moduleIds: [], isNewHire: true },
  { id: 'e-yildiz', name: 'Aylin Yildiz', initials: 'AY', title: 'Kreditanalystin', jobRole: 'Kreditanalyse', department: 'Immobilienfinanzierung', since: '2026-10-01', yearsOfService: 0, status: 'aktiv', knowledgeCoverage: 0, criticality: 'niedrig', projects: [], moduleIds: [], isNewHire: true },
]

/** Anlass je Person (bestimmt den KI-Agenten) */
const SEED_TRIGGERS: Record<string, InterviewTrigger> = {
  'e-krueger': 'schluesselwissen',
  'e-wolf': 'projektende',
  'e-brandt': 'austritt',
  'e-lorenz': 'austritt',
  'e-vogel': 'austritt',
  'e-yilmaz': 'wechsel',
}
for (const e of SEED_EMPLOYEES) {
  if (e.status !== 'aktiv') e.trigger = SEED_TRIGGERS[e.id] ?? 'ruhestand'
}

export function employeeToExpert(e: Employee): Expert {
  return {
    id: e.id,
    name: e.name,
    role: e.title,
    department: e.department,
    yearsOfService: e.yearsOfService,
    retirement: e.exitDate ?? '',
    initials: e.initials,
    knowledgeCoverage: e.knowledgeCoverage,
    focus: e.projects[0]?.name ?? e.jobRole,
  }
}

/* -------------------------- Wissensartikel -------------------------- */

const v = (version: string, date: string, author: string, change: string) => ({ version, date, author, change })

export const SEED_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'a-grundlagen',
    title: 'Grundlagen des Bausparens',
    description: 'Funktionsweise des Bausparens: Sparphase, Zuteilung und Darlehensphase im Überblick.',
    content: [
      'Ein Bausparvertrag kombiniert eine Sparphase mit einem späteren Anspruch auf ein Bauspardarlehen. Die Bausparsumme setzt sich aus dem angesparten Guthaben und dem Darlehen zusammen.',
      'In der Sparphase leistet die Kundin bzw. der Kunde regelmäßige Sparbeiträge. Das Guthaben wird zum vertraglich vereinbarten Guthabenzins verzinst.',
      'Die Zuteilung erfolgt, wenn das tarifliche Mindestsparguthaben erreicht ist und die Bewertungszahl den Zielwert erreicht hat. Erst dann besteht ein Anspruch auf das Bauspardarlehen.',
      'In der Darlehensphase wird das Bauspardarlehen zum bei Vertragsabschluss festgelegten Sollzins getilgt. Die Zinssicherheit ist ein zentrales Beratungsargument.',
    ],
    category: 'Bausparen',
    department: 'LBS Bausparen',
    sourceDocuments: ['Produkthandbuch_Bausparen_2025.pdf', 'Schulung_Bauspar-Basics.pptx'],
    expert: 'Monika Hartmann',
    createdAt: '2023-03-14',
    updatedAt: '2026-09-02',
    validFrom: '2025-01-01',
    validUntil: null,
    status: 'aktuell',
    verification: 'verifiziert',
    versions: [
      v('3.2', '2026-09-02', 'Monika Hartmann', 'Beispiele zur Bewertungszahl aus Experteninterview ergänzt'),
      v('3.1', '2025-01-08', 'Sarah Schneider', 'An Produkthandbuch 2025 angepasst'),
      v('3.0', '2023-03-14', 'Sarah Schneider', 'Erstversion aus Produkthandbuch migriert'),
    ],
    tags: ['Sparphase', 'Zuteilung', 'Bewertungszahl', 'Bauspardarlehen'],
    origin: 'dokument',
    facts: [
      { question: 'Welche zwei Voraussetzungen müssen für die Zuteilung erfüllt sein?', answer: 'Mindestsparguthaben und Ziel-Bewertungszahl', distractors: ['Mindestlaufzeit von 10 Jahren und Bonitätsprüfung', 'Vollständige Einzahlung der Bausparsumme', 'Grundbucheintrag und Prämienantrag'] },
      { question: 'Woraus setzt sich die Bausparsumme zusammen?', answer: 'Aus Sparguthaben und Bauspardarlehen', distractors: ['Aus Eigenkapital und Grundschuld', 'Aus Prämien und Zinsen', 'Aus Abschlussgebühr und Tilgung'] },
    ],
    seed: true,
  },
  {
    id: 'a-tarif-ueberblick',
    title: 'Historische Tarifgenerationen',
    description: 'Überblick über die Tarifgenerationen im Bestand und deren Besonderheiten in der Bearbeitung (Demo-Tarifmodell).',
    content: [
      'Im Bestand befinden sich Verträge aus mehreren Tarifgenerationen: Generation A (1990–2003), Classic 2004 (Neuabschluss 2004–2015) und Vario (seit 2016). Die Tarifnamen sind Demo-Bezeichnungen.',
      'Bestandsverträge werden grundsätzlich nach den Tarifbedingungen bearbeitet, die zum Zeitpunkt des Vertragsabschlusses gültig waren. Spätere Rundschreiben gelten nur, wenn sie dies ausdrücklich vorsehen.',
      'Bei Verträgen, die auf einen neueren Tarif umgestellt wurden, gelten ab dem Umstellungsdatum die Bedingungen des neuen Tarifs. Das Umstellungsdatum ist in der Vertragshistorie zu prüfen.',
    ],
    category: 'Tarife',
    department: 'LBS Bestandsverwaltung',
    sourceDocuments: ['Tarifhistorie_1990-2024.pptx', 'Rundschreiben_RS_07-2015_Tarifumstellung.pdf'],
    expert: 'Klaus Becker',
    createdAt: '2024-02-19',
    updatedAt: '2026-06-11',
    validFrom: '2016-01-01',
    validUntil: null,
    status: 'aktuell',
    verification: 'verifiziert',
    versions: [
      v('2.1', '2026-06-11', 'Klaus Becker', 'Hinweis zu Tarifumstellungen ergänzt'),
      v('2.0', '2024-02-19', 'Sarah Schneider', 'Neu strukturiert nach Tarifgenerationen'),
    ],
    tags: ['Tarifgeneration', 'Bestandsverträge', 'Altverträge', 'Tarifumstellung'],
    origin: 'dokument',
    facts: [
      { question: 'Nach welchen Bedingungen werden Bestandsverträge grundsätzlich bearbeitet?', answer: 'Nach den Tarifbedingungen zum Zeitpunkt des Vertragsabschlusses', distractors: ['Immer nach dem aktuell gültigen Tarif', 'Nach Wahl der Kundin bzw. des Kunden', 'Nach dem zuletzt veröffentlichten Rundschreiben'] },
      { question: 'Was ist bei umgestellten Verträgen zu prüfen?', answer: 'Das Umstellungsdatum in der Vertragshistorie', distractors: ['Die Bonität zum Abschlusszeitpunkt', 'Die Anzahl der Sparraten', 'Den Wohnort der Kundin bzw. des Kunden'] },
    ],
    seed: true,
  },
  {
    id: 'a-generation-a',
    title: 'Tarifbedingungen Generation A',
    description: 'Tarifbedingungen der Generation A für Neuabschlüsse 1990–2003 (historische Regelung, Demo).',
    content: [
      'Die Tarifbedingungen der Generation A galten für Neuabschlüsse zwischen 1990 und 2003. Für Neuabschlüsse sind sie seit dem 01.01.2004 nicht mehr anwendbar.',
      'Kennzeichnend war eine feste Guthabenverzinsung ohne Bonusoption sowie eine längere Mindestsparzeit bis zur Zuteilung.',
      'Für noch laufende Bestandsverträge bleiben die Bedingungen maßgeblich, sofern keine Tarifumstellung erfolgt ist.',
    ],
    category: 'Tarife',
    department: 'LBS Bestandsverwaltung',
    sourceDocuments: ['Tarifhistorie_1990-2024.pptx'],
    expert: 'Klaus Becker',
    createdAt: '2019-05-06',
    updatedAt: '2024-02-19',
    validFrom: '1990-01-01',
    validUntil: '2003-12-31',
    status: 'historisch',
    verification: 'verifiziert',
    versions: [v('1.2', '2024-02-19', 'Klaus Becker', 'Als historisch gekennzeichnet'), v('1.0', '2019-05-06', 'Archiv-Migration', 'Aus Altablage übernommen')],
    tags: ['Generation A', 'Altverträge', 'Historisch'],
    origin: 'dokument',
    supersededBy: 'a-tarif-ueberblick',
    seed: true,
  },
  {
    id: 'a-wop-2021',
    title: 'Wohnungsbauprämie – Regelung ab 2021',
    description: 'Aktuelle Fördersätze, Höchstbeträge und Einkommensgrenzen der Wohnungsbauprämie.',
    content: [
      'Seit dem Sparjahr 2021 beträgt die Wohnungsbauprämie 10 % der prämienbegünstigten Sparleistung.',
      'Gefördert werden jährlich bis zu 700 € Sparleistung bei Alleinstehenden und bis zu 1.400 € bei zusammenveranlagten Ehe- bzw. Lebenspartnern.',
      'Die Einkommensgrenzen liegen bei 35.000 € bzw. 70.000 € zu versteuerndem Einkommen.',
    ],
    category: 'Förderung',
    department: 'LBS Bausparen',
    sourceDocuments: ['Rundschreiben_RS_02-2021_Wohnungsbaupraemie.pdf'],
    expert: 'Petra Krüger',
    createdAt: '2021-01-12',
    updatedAt: '2026-01-15',
    validFrom: '2021-01-01',
    validUntil: null,
    status: 'aktuell',
    verification: 'verifiziert',
    versions: [v('1.3', '2026-01-15', 'Petra Krüger', 'Jährliche Überprüfung – keine Änderung'), v('1.0', '2021-01-12', 'Sarah Schneider', 'Neue Regelung ab 2021 angelegt')],
    tags: ['Wohnungsbauprämie', 'Förderung', 'Einkommensgrenze'],
    origin: 'dokument',
    facts: [
      { question: 'Wie hoch ist die Wohnungsbauprämie seit 2021?', answer: '10 % der begünstigten Sparleistung', distractors: ['8,8 % der begünstigten Sparleistung', '5 % der Bausparsumme', '15 % der Sparleistung'], explanation: 'Seit dem Sparjahr 2021 gilt ein Prämiensatz von 10 %. Der frühere Satz von 8,8 % ist historisch.' },
      { question: 'Welche Einkommensgrenze gilt seit 2021 für Alleinstehende?', answer: '35.000 € zu versteuerndes Einkommen', distractors: ['25.600 € zu versteuerndes Einkommen', '40.000 € Bruttoeinkommen', '17.900 € zu versteuerndes Einkommen'] },
    ],
    seed: true,
  },
  {
    id: 'a-wop-alt',
    title: 'Wohnungsbauprämie – Regelung bis 2020',
    description: 'Frühere Fördersätze und Einkommensgrenzen der Wohnungsbauprämie (bis Sparjahr 2020).',
    content: [
      'Bis einschließlich Sparjahr 2020 betrug die Wohnungsbauprämie 8,8 % der prämienbegünstigten Sparleistung.',
      'Begünstigt waren bis zu 512 € (Alleinstehende) bzw. 1.024 € (Verheiratete) Sparleistung pro Jahr bei Einkommensgrenzen von 25.600 € bzw. 51.200 €.',
      'Die Regelung ist nur noch für die Prüfung von Prämienansprüchen aus Sparjahren bis 2020 relevant.',
    ],
    category: 'Förderung',
    department: 'LBS Bausparen',
    sourceDocuments: ['Rundschreiben_RS_11-2019_Praemien.pdf'],
    expert: 'Petra Krüger',
    createdAt: '2019-11-20',
    updatedAt: '2021-01-12',
    validFrom: '2004-01-01',
    validUntil: '2020-12-31',
    status: 'historisch',
    verification: 'verifiziert',
    versions: [v('2.0', '2021-01-12', 'Sarah Schneider', 'Als historisch markiert, Nachfolgeregelung verknüpft')],
    tags: ['Wohnungsbauprämie', 'Historisch'],
    origin: 'dokument',
    supersededBy: 'a-wop-2021',
    seed: true,
  },
  {
    id: 'a-foerder-hessen',
    title: 'Förderprogramme Hessen',
    description: 'Landesförderung für selbst genutztes Wohneigentum über die WIBank – Beratungshinweise.',
    content: [
      'Die WIBank fördert im Auftrag des Landes Hessen den Bau und Erwerb von selbst genutztem Wohneigentum, unter anderem über zinsgünstige Darlehen.',
      'Konditionen, Einkommensgrenzen und Zielgruppen werden regelmäßig angepasst. Vor jeder Beratung sind die aktuell veröffentlichten Programmbedingungen heranzuziehen.',
      'Prüfhinweis: Die Programmbedingungen 2026 wurden noch nicht vollständig mit der neuen Förderrichtlinie abgeglichen.',
    ],
    category: 'Förderung',
    department: 'WIBank Förderung',
    sourceDocuments: ['Foerderrichtlinie_WIBank_Wohneigentum_2025.pdf'],
    expert: 'Andrea Vogel',
    createdAt: '2025-02-03',
    updatedAt: '2026-10-21',
    validFrom: '2025-01-01',
    validUntil: '2026-12-31',
    status: 'pruefung',
    verification: 'in_pruefung',
    versions: [v('1.4', '2026-10-21', 'KI-Dokumentanalyse', 'Möglicher Widerspruch zur Förderrichtlinie erkannt'), v('1.0', '2025-02-03', 'Andrea Vogel', 'Erstellt')],
    tags: ['WIBank', 'Landesförderung', 'Hessen', 'Wohneigentum'],
    origin: 'dokument',
    seed: true,
  },
  {
    id: 'a-kombi',
    title: 'Immobilienfinanzierung',
    description: 'Kombination von Annuitätendarlehen und Bausparvertrag in der privaten Immobilienfinanzierung.',
    content: [
      'In der Kombifinanzierung wird ein tilgungsfreies Vorausdarlehen mit einem Bausparvertrag kombiniert. Nach Zuteilung löst das Bauspardarlehen das Vorausdarlehen ab.',
      'Vorteil ist die frühe Zinssicherheit für die gesamte Laufzeit. Zu beachten sind die Zinskosten des Vorausdarlehens während der Sparphase.',
      'Für die Beratung ist eine transparente Gesamtkostenbetrachtung im Vergleich zum klassischen Annuitätendarlehen erforderlich.',
    ],
    category: 'Finanzierung',
    department: 'Immobilienfinanzierung',
    sourceDocuments: ['Produkthandbuch_Bausparen_2025.pdf', 'Beratungsleitfaden_2024.docx'],
    expert: 'Jürgen Wolf',
    createdAt: '2022-08-30',
    updatedAt: '2026-04-17',
    validFrom: '2024-04-01',
    validUntil: null,
    status: 'aktuell',
    verification: 'verifiziert',
    versions: [v('2.2', '2026-04-17', 'Jürgen Wolf', 'Gesamtkostenvergleich ergänzt'), v('2.0', '2024-04-01', 'Sabine Lorenz', 'An Beratungsleitfaden 2024 angepasst')],
    tags: ['Kombifinanzierung', 'Vorausdarlehen', 'Zinssicherheit'],
    origin: 'dokument',
    facts: [
      { question: 'Was löst in der Kombifinanzierung nach Zuteilung das Vorausdarlehen ab?', answer: 'Das Bauspardarlehen', distractors: ['Ein KfW-Kredit', 'Ein Ratenkredit', 'Die Wohnungsbauprämie'] },
    ],
    seed: true,
  },
  {
    id: 'a-beratung-2024',
    title: 'Interne Beratungsprozesse',
    description: 'Beratungsleitfaden 2024: Ablauf, Dokumentation und Qualitätssicherung im Beratungsgespräch.',
    content: [
      'Jedes Beratungsgespräch folgt dem Ablauf Bedarfsanalyse, Lösungsentwicklung, Angebotserläuterung und Dokumentation.',
      'Das Beratungsprotokoll wird seit April 2024 digital im Beratungssystem erstellt und von der Kundin bzw. dem Kunden elektronisch bestätigt.',
      'Abweichungen vom Standardprozess sind zu begründen und durch die Teamleitung freizugeben.',
    ],
    category: 'Prozesse',
    department: 'Vertrieb & Beratung',
    sourceDocuments: ['Beratungsleitfaden_2024.docx'],
    expert: 'Sabine Lorenz',
    createdAt: '2024-04-01',
    updatedAt: '2026-08-05',
    validFrom: '2024-04-01',
    validUntil: null,
    status: 'aktuell',
    verification: 'verifiziert',
    versions: [v('1.1', '2026-08-05', 'Sabine Lorenz', 'Freigabeprozess präzisiert'), v('1.0', '2024-04-01', 'Sabine Lorenz', 'Ersetzt Beratungsprotokoll 2017')],
    tags: ['Beratung', 'Protokoll', 'Qualitätssicherung'],
    origin: 'dokument',
    facts: [
      { question: 'Wie wird das Beratungsprotokoll seit April 2024 erstellt?', answer: 'Digital im Beratungssystem mit elektronischer Bestätigung', distractors: ['Handschriftlich auf Papier', 'Per E-Mail an die Teamleitung', 'Gar nicht mehr'] },
    ],
    seed: true,
  },
  {
    id: 'a-beratung-2017',
    title: 'Beratungsprotokoll Version 2017',
    description: 'Papierbasiertes Beratungsprotokoll – ersetzt durch den Beratungsleitfaden 2024.',
    content: [
      'Das papierbasierte Beratungsprotokoll (Version 2017) wurde zum 31.03.2024 außer Kraft gesetzt.',
      'Es darf für neue Beratungen nicht mehr verwendet werden. Maßgeblich ist der Beratungsleitfaden 2024.',
    ],
    category: 'Prozesse',
    department: 'Vertrieb & Beratung',
    sourceDocuments: ['Beratungsprotokoll_V2017.docx'],
    expert: 'Sabine Lorenz',
    createdAt: '2017-07-01',
    updatedAt: '2024-04-01',
    validFrom: '2017-07-01',
    validUntil: '2024-03-31',
    status: 'veraltet',
    verification: 'verifiziert',
    versions: [v('3.0', '2024-04-01', 'Sabine Lorenz', 'Als veraltet markiert')],
    tags: ['Beratung', 'Veraltet'],
    origin: 'dokument',
    supersededBy: 'a-beratung-2024',
    seed: true,
  },
  {
    id: 'a-wikr',
    title: 'Regulatorische Anforderungen',
    description: 'Wohnimmobilienkreditrichtlinie: Kreditwürdigkeitsprüfung, ESIS-Merkblatt und Dokumentationspflichten.',
    content: [
      'Mit Umsetzung der Wohnimmobilienkreditrichtlinie am 21.03.2016 gelten erweiterte Pflichten bei Immobiliar-Verbraucherdarlehen.',
      'Vor Vertragsschluss ist eine Kreditwürdigkeitsprüfung durchzuführen (§ 505a BGB). Die Kundin bzw. der Kunde erhält das Europäische Standardisierte Merkblatt (ESIS).',
      'Beratungs- und Prüfungsschritte sind nachvollziehbar zu dokumentieren und für Prüfungen vorzuhalten.',
    ],
    category: 'Regulatorik',
    department: 'Compliance & Regulatorik',
    sourceDocuments: ['WIKR_Umsetzung_Compliance.pdf'],
    expert: 'Dr. Thomas Yilmaz',
    createdAt: '2016-03-01',
    updatedAt: '2026-03-12',
    validFrom: '2016-03-21',
    validUntil: null,
    status: 'aktuell',
    verification: 'verifiziert',
    versions: [v('4.0', '2026-03-12', 'Dr. Thomas Yilmaz', 'Jährliche Compliance-Prüfung'), v('1.0', '2016-03-01', 'Compliance', 'Erstellt')],
    tags: ['WIKR', 'ESIS', 'Kreditwürdigkeitsprüfung', 'Compliance'],
    origin: 'dokument',
    facts: [
      { question: 'Welches Merkblatt erhält die Kundin bzw. der Kunde bei Immobiliar-Verbraucherdarlehen?', answer: 'Das ESIS-Merkblatt', distractors: ['Das Produktinformationsblatt Bausparen', 'Den Tarifauszug', 'Die Prämienbescheinigung'] },
      { question: 'Seit wann gilt die Umsetzung der Wohnimmobilienkreditrichtlinie?', answer: '21.03.2016', distractors: ['01.01.2004', '31.12.2015', '01.04.2024'] },
    ],
    seed: true,
  },
  {
    id: 'a-kuendigung',
    title: 'Kündigung von Altverträgen nach Zuteilungsreife',
    description: 'Kündigungsrecht der Bausparkasse zehn Jahre nach Eintritt der Zuteilungsreife.',
    content: [
      'Nach der Rechtsprechung des BGH vom 21.02.2017 dürfen Bausparkassen Verträge kündigen, wenn seit Eintritt der Zuteilungsreife mehr als zehn Jahre vergangen sind und kein Darlehen in Anspruch genommen wurde.',
      'Vor einer Kündigung sind Vertragsstatus, Zuteilungsreife und etwaige Sonderregelungen des Tarifs zu prüfen.',
      'Die Kommunikation mit der Kundin bzw. dem Kunden erfolgt mit den freigegebenen Textbausteinen der Bestandsverwaltung.',
    ],
    category: 'Bausparen',
    department: 'LBS Bestandsverwaltung',
    sourceDocuments: ['Rechtsinfo_BGH_2017_Kuendigung.pdf'],
    expert: 'Frank Richter',
    createdAt: '2017-03-15',
    updatedAt: '2025-11-03',
    validFrom: '2017-02-21',
    validUntil: null,
    status: 'aktuell',
    verification: 'verifiziert',
    versions: [v('1.4', '2025-11-03', 'Frank Richter', 'Textbausteine aktualisiert')],
    tags: ['Kündigung', 'Zuteilungsreife', 'BGH', 'Altverträge'],
    origin: 'dokument',
    facts: [
      { question: 'Wann darf eine Bausparkasse einen Vertrag nach BGH-Rechtsprechung kündigen?', answer: 'Mehr als zehn Jahre nach Zuteilungsreife ohne Darlehensinanspruchnahme', distractors: ['Jederzeit ohne Frist', 'Fünf Jahre nach Vertragsabschluss', 'Nur bei Zahlungsverzug'] },
    ],
    seed: true,
  },
]

/* ----------------------------- Dokumente ----------------------------- */

function analysis(a: Omit<DocumentAnalysis, 'confidence'> & { confidence?: number }): DocumentAnalysis {
  return { confidence: 0.91, ...a }
}

export const SEED_DOCUMENTS: Document[] = [
  {
    id: 'd-produkthandbuch',
    name: 'Produkthandbuch_Bausparen_2025.pdf',
    type: 'PDF',
    sizeKb: 4820,
    uploadedAt: daysAgo(9, 10),
    uploadedBy: 'Sarah Schneider',
    department: 'LBS Bausparen',
    status: 'imported',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: ['a-grundlagen'],
    seed: true,
    analysis: analysis({
      suggestedTitle: 'Grundlagen des Bausparens',
      category: 'Bausparen',
      summary: 'Das Produkthandbuch beschreibt Aufbau, Phasen und Konditionen der aktuellen Bauspartarife sowie die Voraussetzungen der Zuteilung.',
      topics: ['Bausparen', 'Sparphase', 'Zuteilung', 'Darlehensphase'],
      keyConcepts: [
        { term: 'Bewertungszahl', definition: 'Kennzahl, die Sparleistung und Spardauer abbildet und über den Zuteilungszeitpunkt entscheidet.' },
        { term: 'Mindestsparguthaben', definition: 'Tariflich festgelegter Anteil der Bausparsumme, der vor Zuteilung angespart sein muss.' },
      ],
      importantDates: [{ date: '2025-01-01', label: 'Inkrafttreten Handbuch 2025' }],
      validity: { validFrom: '2025-01-01', validUntil: null, status: 'aktuell', note: 'Aktuell gültige Fassung.' },
      contradictions: [],
      missingKnowledge: [],
      source: { author: 'Produktmanagement', department: 'LBS Bausparen', pages: 64, reference: 'PH-BS-2025', classification: 'Intern' },
    }),
  },
  {
    id: 'd-rs-2015',
    name: 'Rundschreiben_RS_07-2015_Tarifumstellung.pdf',
    type: 'PDF',
    sizeKb: 612,
    uploadedAt: daysAgo(8, 14),
    uploadedBy: 'Sarah Schneider',
    department: 'LBS Bestandsverwaltung',
    status: 'imported',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: ['a-tarif-ueberblick'],
    seed: true,
    analysis: analysis({
      suggestedTitle: 'Tarifumstellung 2016',
      category: 'Tarife',
      summary: 'Das Rundschreiben regelt die Einstellung des Neugeschäfts im Tarif Classic 2004 zum 31.12.2015 und die Einführung des Vario-Tarifs.',
      topics: ['Tarifumstellung', 'Classic 2004', 'Vario'],
      keyConcepts: [{ term: 'Tarifumstellung', definition: 'Wechsel eines Bestandsvertrags in eine neuere Tarifgeneration.' }],
      importantDates: [
        { date: '2015-12-31', label: 'Ende Neuabschluss Classic 2004' },
        { date: '2016-01-01', label: 'Start Vario-Tarif' },
      ],
      validity: { validFrom: '2015-07-01', validUntil: null, status: 'aktuell', note: 'Gilt unbefristet für die Abgrenzung der Tarifgenerationen.' },
      contradictions: [],
      missingKnowledge: ['Anwendung auf Bestandsverträge nicht explizit geregelt'],
      source: { author: 'Bestandsverwaltung', department: 'LBS Bestandsverwaltung', pages: 6, reference: 'RS 07/2015', classification: 'Intern' },
    }),
  },
  {
    id: 'd-schulung',
    name: 'Schulung_Bauspar-Basics.pptx',
    type: 'PPTX',
    sizeKb: 8710,
    uploadedAt: daysAgo(6, 11),
    uploadedBy: 'Monika Hartmann',
    department: 'LBS Bausparen',
    status: 'analyzed',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: [],
    seed: true,
    analysis: analysis({
      suggestedTitle: 'Bauspar-Basics für Einsteiger',
      category: 'Bausparen',
      summary: 'Schulungsfolien für neue Mitarbeitende mit Grundlagen zum Bausparen, Beispielrechnungen und typischen Kundenfragen.',
      topics: ['Onboarding', 'Bausparen', 'Kundenfragen'],
      keyConcepts: [{ term: 'Regelsparbeitrag', definition: 'Monatlicher Sparbeitrag in Promille der Bausparsumme.' }],
      importantDates: [{ date: '2023-09-01', label: 'Letzte Aktualisierung der Folien' }],
      validity: { validFrom: '2023-09-01', validUntil: null, status: 'pruefung', note: 'Beispielrechnungen basieren auf Konditionen 2023 – Aktualisierung prüfen.' },
      contradictions: [{ id: 'c-s1', text: 'Folie 14 nennt einen Guthabenzins, der vom Produkthandbuch 2025 abweicht.', severity: 'mittel' }],
      missingKnowledge: ['Aktuelle Beispielrechnungen 2025'],
      source: { author: 'Monika Hartmann', department: 'LBS Bausparen', pages: 38, reference: 'SCH-BB-2023', classification: 'Intern' },
      confidence: 0.86,
    }),
  },
  {
    id: 'd-beratung',
    name: 'Beratungsleitfaden_2024.docx',
    type: 'DOCX',
    sizeKb: 1340,
    uploadedAt: daysAgo(5, 9),
    uploadedBy: 'Sabine Lorenz',
    department: 'Vertrieb & Beratung',
    status: 'imported',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: ['a-beratung-2024'],
    seed: true,
    analysis: analysis({
      suggestedTitle: 'Interne Beratungsprozesse',
      category: 'Prozesse',
      summary: 'Der Leitfaden definiert den verbindlichen Ablauf von Beratungsgesprächen und ersetzt das Beratungsprotokoll 2017.',
      topics: ['Beratung', 'Dokumentation', 'Qualitätssicherung'],
      keyConcepts: [{ term: 'Bedarfsanalyse', definition: 'Strukturierte Erhebung von Zielen, Finanzlage und Risikobereitschaft.' }],
      importantDates: [{ date: '2024-04-01', label: 'Inkrafttreten' }, { date: '2024-03-31', label: 'Außerkraftsetzung Protokoll 2017' }],
      validity: { validFrom: '2024-04-01', validUntil: null, status: 'aktuell', note: 'Aktuell gültig.' },
      contradictions: [],
      missingKnowledge: [],
      source: { author: 'Vertriebsmanagement', department: 'Vertrieb & Beratung', pages: 22, reference: 'BL-2024', classification: 'Intern' },
    }),
  },
  {
    id: 'd-foerder',
    name: 'Foerderrichtlinie_WIBank_Wohneigentum_2025.pdf',
    type: 'PDF',
    sizeKb: 2210,
    uploadedAt: hoursAgo(5),
    uploadedBy: 'Andrea Vogel',
    department: 'WIBank Förderung',
    status: 'analyzed',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: [],
    seed: true,
    analysis: analysis({
      suggestedTitle: 'Förderrichtlinie Wohneigentum 2025',
      category: 'Förderung',
      summary: 'Die Richtlinie beschreibt Fördergegenstand, Antragsberechtigte und Verfahren der Landesförderung für selbst genutztes Wohneigentum.',
      topics: ['Landesförderung', 'Wohneigentum', 'Antragsverfahren'],
      keyConcepts: [{ term: 'Antragsberechtigte', definition: 'Haushalte, die die Einkommensgrenzen der jeweiligen Programmfassung einhalten.' }],
      importantDates: [{ date: '2025-01-01', label: 'Inkrafttreten' }, { date: '2026-12-31', label: 'Befristung der Richtlinie' }],
      validity: { validFrom: '2025-01-01', validUntil: '2026-12-31', status: 'pruefung', note: 'Befristet bis 31.12.2026 – Nachfolgeregelung noch nicht hinterlegt.' },
      contradictions: [
        { id: 'c-f1', text: 'Abschnitt 3 nennt andere Einkommensgrenzen als der Knowledge-Base-Artikel „Förderprogramme Hessen“.', severity: 'hoch' },
        { id: 'c-f2', text: 'Antragsfrist im Anhang weicht vom Haupttext ab.', severity: 'mittel' },
      ],
      missingKnowledge: ['Nachfolgeregelung ab 2027', 'Praxisbeispiele zur Kombination mit Bausparen'],
      source: { author: 'WIBank', department: 'WIBank Förderung', pages: 18, reference: 'FR-WE-2025', classification: 'Öffentlich' },
      confidence: 0.88,
    }),
  },
  {
    id: 'd-notizen',
    name: 'Notizen_Bestandsverwaltung_Altvertraege.txt',
    type: 'TXT',
    sizeKb: 14,
    uploadedAt: daysAgo(3, 16),
    uploadedBy: 'Frank Richter',
    department: 'LBS Bestandsverwaltung',
    status: 'analyzed',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: [],
    seed: true,
    previewText:
      'Notizen Bestandsverwaltung – Altverträge\n\n- Bei Generation A immer Vertragshistorie prüfen (Umstellungen!)\n- Bonuszins nur bei Classic 2004 mit Darlehensverzicht\n- Rückfragen: Team Bestandsverwaltung / K. Becker\n- TODO: Checkliste ins SharePoint übertragen',
    analysis: analysis({
      suggestedTitle: 'Praxisnotizen Altverträge',
      category: 'Tarife',
      summary: 'Persönliche Arbeitsnotizen mit Praxis-Hinweisen zur Bearbeitung von Altverträgen und Verweisen auf Ansprechpersonen.',
      topics: ['Altverträge', 'Vertragshistorie', 'Bonuszins'],
      keyConcepts: [{ term: 'Bonuszins', definition: 'Zusätzliche Verzinsung bei Verzicht auf das Bauspardarlehen (tarifabhängig).' }],
      importantDates: [],
      validity: { validFrom: '2024-01-01', validUntil: null, status: 'pruefung', note: 'Informelle Notizen ohne Freigabe – fachliche Validierung erforderlich.' },
      contradictions: [],
      missingKnowledge: ['Formale Prüfroutine fehlt', 'Checkliste nicht dokumentiert'],
      source: { author: 'Frank Richter', department: 'LBS Bestandsverwaltung', pages: 1, reference: 'Persönliche Ablage', classification: 'Intern' },
      confidence: 0.74,
    }),
  },
  {
    id: 'd-wikr',
    name: 'WIKR_Umsetzung_Compliance.pdf',
    type: 'PDF',
    sizeKb: 3150,
    uploadedAt: daysAgo(12, 9),
    uploadedBy: 'Dr. Thomas Yilmaz',
    department: 'Compliance & Regulatorik',
    status: 'imported',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: ['a-wikr'],
    seed: true,
    analysis: analysis({
      suggestedTitle: 'Regulatorische Anforderungen',
      category: 'Regulatorik',
      summary: 'Compliance-Leitfaden zur Umsetzung der Wohnimmobilienkreditrichtlinie mit Prüf- und Dokumentationspflichten.',
      topics: ['WIKR', 'Kreditwürdigkeitsprüfung', 'ESIS'],
      keyConcepts: [{ term: 'ESIS', definition: 'Europäisches Standardisiertes Merkblatt für Immobiliar-Verbraucherdarlehen.' }],
      importantDates: [{ date: '2016-03-21', label: 'Inkrafttreten der Umsetzung' }],
      validity: { validFrom: '2016-03-21', validUntil: null, status: 'aktuell', note: 'Aktuell gültig.' },
      contradictions: [],
      missingKnowledge: [],
      source: { author: 'Compliance', department: 'Compliance & Regulatorik', pages: 41, reference: 'CMP-WIKR-04', classification: 'Vertraulich' },
    }),
  },
  {
    id: 'd-tarifhistorie',
    name: 'Tarifhistorie_1990-2024.pptx',
    type: 'PPTX',
    sizeKb: 5630,
    uploadedAt: daysAgo(14, 15),
    uploadedBy: 'Klaus Becker',
    department: 'LBS Bestandsverwaltung',
    status: 'imported',
    progress: 100,
    currentStep: 7,
    linkedArticleIds: ['a-generation-a'],
    seed: true,
    analysis: analysis({
      suggestedTitle: 'Tarifhistorie 1990–2024',
      category: 'Tarife',
      summary: 'Präsentation zur Entwicklung der Tarifgenerationen von 1990 bis 2024 mit Zeitstrahl und Kerneigenschaften.',
      topics: ['Tarifhistorie', 'Generation A', 'Classic 2004', 'Vario'],
      keyConcepts: [{ term: 'Tarifgeneration', definition: 'Gruppe von Tarifen mit gemeinsamen Bedingungen und Abschlusszeitraum.' }],
      importantDates: [{ date: '2004-01-01', label: 'Start Classic 2004' }, { date: '2016-01-01', label: 'Start Vario' }],
      validity: { validFrom: '1990-01-01', validUntil: null, status: 'aktuell', note: 'Historischer Überblick, inhaltlich aktuell.' },
      contradictions: [],
      missingKnowledge: [],
      source: { author: 'Klaus Becker', department: 'LBS Bestandsverwaltung', pages: 27, reference: 'TH-1990-2024', classification: 'Intern' },
    }),
  },
]

/* ----------------------------- Interviews ----------------------------- */

const hartmann = EXPERTS.find((e) => e.id === 'ex-hartmann') as Expert

export const SEED_INTERVIEWS: ExpertInterview[] = [
  {
    id: 'i-hartmann',
    title: 'Zuteilungsprozess & Bewertungszahl',
    scriptId: 'generisch',
    expert: hartmann,
    employeeId: 'e-hartmann',
    status: 'abgeschlossen',
    startedAt: hoursAgo(5),
    updatedAt: hoursAgo(3),
    savedAt: hoursAgo(3),
    step: 5,
    messages: [
      { id: 'm1', role: 'ai', text: 'Guten Tag, Frau Hartmann. Welche Sonderfälle treten bei der Zuteilung regelmäßig auf?', timestamp: hoursAgo(5) },
      { id: 'm2', role: 'expert', text: 'Häufig sind Teilzuteilungen bei Vertragsteilungen – die stehen so nicht im Handbuch.', timestamp: hoursAgo(5) },
      { id: 'm3', role: 'ai', text: 'Welche Regeln gelten bei der Bewertungszahl nach einer Vertragsteilung?', timestamp: hoursAgo(4.9) },
      { id: 'm4', role: 'expert', text: 'Die Bewertungszahl wird anteilig übernommen, aber neu berechnet, sobald Sonderzahlungen eingehen.', timestamp: hoursAgo(4.8) },
      { id: 'm5', role: 'ai', text: 'Vielen Dank – ich habe die Aussagen strukturiert. Das Wissen wurde in der Knowledge Base gespeichert.', timestamp: hoursAgo(3) },
    ],
    topics: [
      { id: 'g1', label: 'Sonderfälle', done: true },
      { id: 'g2', label: 'Bewertungszahl', done: true },
      { id: 'g3', label: 'Typische Fehler', done: true },
    ],
    extracted: [
      { id: 'ek1', statement: 'Teilzuteilungen bei Vertragsteilungen sind nicht im Handbuch beschrieben.', topic: 'Sonderfälle', confidence: 0.9, status: 'validiert', createdAt: hoursAgo(5) },
      { id: 'ek2', statement: 'Die Bewertungszahl wird bei Vertragsteilung anteilig übernommen und bei Sonderzahlungen neu berechnet.', topic: 'Bewertungszahl', confidence: 0.88, status: 'validiert', createdAt: hoursAgo(4.8) },
    ],
    pendingQuestion: null,
    followUps: [],
    missingInfo: [
      { id: 'gm1', label: 'Sonderfälle der Zuteilung', resolved: true },
      { id: 'gm2', label: 'Berechnung der Bewertungszahl', resolved: true },
    ],
    contradictions: [],
    savedArticleIds: ['a-grundlagen'],
    seed: true,
  },
]

/* --------------------------- Lernmodule --------------------------- */

let qCounter = 0
function q(question: string, options: string[], correctIndex: number, explanation: string): QuizQuestion {
  qCounter += 1
  return { id: `sq-${qCounter}`, question, options, correctIndex, explanation }
}
function s(title: string, bullets: string[], notes: string): Slide {
  return { title, bullets, notes }
}
function chapter(
  id: string,
  title: string,
  type: Chapter['type'],
  durationMin: number,
  summary: string,
  slides: Slide[],
  questions: QuizQuestion[],
): Chapter {
  return { id, title, type, durationMin, summary, slides, quiz: { id: `quiz-${id}`, title: `Wissenscheck: ${title}`, passingScore: 80, questions } }
}

export const SEED_MODULES: LearningModule[] = [
  {
    id: 'm-grundlagen',
    title: 'Grundlagen des Bausparens',
    description: 'Der Einstieg für neue Mitarbeitende: Wie Bausparen funktioniert und worauf es in der Beratung ankommt.',
    category: 'Bausparen',
    level: 'Anfänger',
    difficulty: 'Leicht',
    durationMin: 45,
    sourceArticleIds: ['a-grundlagen'],
    createdAt: '2026-05-04',
    generated: false,
    targetRoles: ['Sachbearbeitung Bestandsverwaltung', 'Bausparberatung'],
    sourceExperts: ['Monika Hartmann', 'Elke Neumann'],
    seed: true,
    chapters: [
      chapter('c-g1', 'Was ist Bausparen?', 'video', 12, 'Grundidee, Nutzen und Zielgruppen des Bausparens.', [
        s('Was ist Bausparen?', ['Kombination aus Sparphase und Darlehensanspruch', 'Zinssicherheit für die spätere Finanzierung', 'Bausparsumme = Sparguthaben + Bauspardarlehen'], 'Bausparen verbindet Sparen mit einem späteren Anspruch auf ein Darlehen zu festen Konditionen.'),
        s('Für wen eignet sich Bausparen?', ['Planbare Modernisierung oder Erwerb von Wohneigentum', 'Absicherung gegen steigende Zinsen', 'Nutzung staatlicher Förderung'], 'Typische Zielgruppen sind Kundinnen und Kunden mit mittelfristigem Wohnwunsch.'),
      ], [
        q('Woraus setzt sich die Bausparsumme zusammen?', ['Aus Sparguthaben und Bauspardarlehen', 'Aus Eigenkapital und Grundschuld', 'Aus Zinsen und Prämien', 'Aus Abschlussgebühr und Tilgung'], 0, 'Die Bausparsumme besteht aus dem angesparten Guthaben und dem späteren Bauspardarlehen.'),
        q('Was ist ein zentrales Beratungsargument für Bausparen?', ['Zinssicherheit für die spätere Finanzierung', 'Garantierte Kursgewinne', 'Keine Sparphase notwendig', 'Sofortige Auszahlung der Bausparsumme'], 0, 'Der Darlehenszins wird bei Abschluss festgelegt – das schafft Planungssicherheit.'),
        q('Für welches Vorhaben ist Bausparen typischerweise gedacht?', ['Erwerb oder Modernisierung von Wohneigentum', 'Kurzfristige Konsumfinanzierung', 'Aktienhandel', 'Altersvorsorge ohne Wohnbezug'], 0, 'Bausparen dient der wohnwirtschaftlichen Verwendung.'),
      ]),
      chapter('c-g2', 'Spar- und Darlehensphase', 'praesentation', 15, 'Ablauf der Sparphase und Bedingungen der Darlehensphase.', [
        s('Die Sparphase', ['Regelmäßige Sparbeiträge', 'Verzinsung zum Guthabenzins', 'Aufbau der Bewertungszahl'], 'In der Sparphase entsteht der Anspruch auf das spätere Darlehen.'),
        s('Die Darlehensphase', ['Auszahlung nach Zuteilung', 'Fester Sollzins', 'Planbare Tilgung'], 'Nach der Zuteilung wird das Darlehen ausgezahlt und zu festen Konditionen getilgt.'),
      ], [
        q('Wie wird das Guthaben in der Sparphase verzinst?', ['Zum vertraglich vereinbarten Guthabenzins', 'Zum aktuellen Leitzins', 'Gar nicht', 'Zum Dispozins'], 0, 'Maßgeblich ist der im Tarif vereinbarte Guthabenzins.'),
        q('Was gilt für den Sollzins des Bauspardarlehens?', ['Er wird bei Vertragsabschluss festgelegt', 'Er schwankt monatlich', 'Er wird bei Zuteilung neu verhandelt', 'Er entspricht immer dem Guthabenzins'], 0, 'Der Sollzins ist bereits bei Abschluss festgelegt.'),
        q('Wann wird das Bauspardarlehen ausgezahlt?', ['Nach der Zuteilung', 'Direkt bei Vertragsabschluss', 'Nach zehn Jahren automatisch', 'Nach der ersten Sparrate'], 0, 'Voraussetzung für die Auszahlung ist die Zuteilung.'),
      ]),
      chapter('c-g3', 'Zuteilung und Bewertungszahl', 'lektion', 18, 'Voraussetzungen der Zuteilung und Rolle der Bewertungszahl.', [
        s('Voraussetzungen der Zuteilung', ['Mindestsparguthaben erreicht', 'Ziel-Bewertungszahl erreicht', 'Annahme der Zuteilung durch die Kundin bzw. den Kunden'], 'Beide Voraussetzungen müssen gleichzeitig erfüllt sein.'),
        s('Die Bewertungszahl', ['Bildet Sparleistung und Spardauer ab', 'Wird zu Stichtagen ermittelt', 'Sonderzahlungen wirken sich aus'], 'Die Bewertungszahl entscheidet über den Zuteilungszeitpunkt.'),
      ], [
        q('Welche zwei Voraussetzungen müssen für die Zuteilung erfüllt sein?', ['Mindestsparguthaben und Ziel-Bewertungszahl', 'Bonitätsprüfung und Grundbucheintrag', 'Zehn Jahre Laufzeit und Prämienantrag', 'Volle Bausparsumme angespart'], 0, 'Mindestsparguthaben und Bewertungszahl sind die beiden Kernvoraussetzungen.'),
        q('Was bildet die Bewertungszahl ab?', ['Sparleistung und Spardauer', 'Nur das Einkommen', 'Den Immobilienwert', 'Die Anzahl der Beratungsgespräche'], 0, 'Die Bewertungszahl kombiniert Sparleistung und Zeit.'),
        q('Wie wirken sich Sonderzahlungen aus?', ['Sie können die Bewertungszahl erhöhen', 'Sie haben keinen Einfluss', 'Sie führen zur Kündigung', 'Sie senken den Sollzins'], 0, 'Sonderzahlungen erhöhen das Guthaben und damit die Bewertungszahl.'),
      ]),
    ],
  },
  {
    id: 'm-tarife',
    title: 'Historische Tarifgenerationen',
    description: 'Altverträge sicher bearbeiten: Tarifgenerationen, Gültigkeiten und typische Fehlerquellen.',
    category: 'Tarife',
    level: 'Fortgeschrittene',
    difficulty: 'Mittel',
    durationMin: 55,
    sourceArticleIds: ['a-tarif-ueberblick', 'a-generation-a'],
    createdAt: '2026-07-21',
    generated: false,
    targetRoles: ['Sachbearbeitung Bestandsverwaltung'],
    sourceExperts: ['Heinz Albrecht'],
    seed: true,
    chapters: [
      chapter('c-t1', 'Überblick der Tarifgenerationen', 'video', 15, 'Generation A, Classic 2004 und Vario im Vergleich (Demo-Tarifmodell).', [
        s('Drei Generationen im Bestand', ['Generation A: 1990–2003', 'Classic 2004: Neuabschluss 2004–2015', 'Vario: seit 2016'], 'Im Bestand befinden sich Verträge aus drei Generationen mit unterschiedlichen Bedingungen.'),
        s('Warum das wichtig ist', ['Bedingungen gelten ab Vertragsabschluss', 'Rundschreiben wirken nicht automatisch rückwirkend', 'Vertragshistorie ist entscheidend'], 'Fehler entstehen vor allem, wenn aktuelle Bedingungen auf Altverträge angewendet werden.'),
      ], [
        q('Bis wann konnten Verträge im Tarif Classic 2004 neu abgeschlossen werden?', ['Bis 31.12.2015', 'Bis 31.12.2003', 'Bis heute', 'Bis 31.03.2024'], 0, 'Das Neugeschäft im Classic-Tarif endete laut RS 07/2015 am 31.12.2015.'),
        q('Welche Bedingungen gelten grundsätzlich für einen Bestandsvertrag?', ['Die bei Vertragsabschluss gültigen Tarifbedingungen', 'Immer die aktuellen Bedingungen', 'Die günstigsten Bedingungen aller Tarife', 'Die Bedingungen des letzten Rundschreibens'], 0, 'Grundsätzlich gelten die Bedingungen zum Abschlusszeitpunkt.'),
        q('Seit wann wird der Vario-Tarif angeboten?', ['Seit 2016', 'Seit 1990', 'Seit 2004', 'Seit 2024'], 0, 'Vario ist die Tarifgeneration seit 2016.'),
      ]),
      chapter('c-t2', 'Bestandsverträge korrekt bearbeiten', 'praesentation', 20, 'Prüfschritte bei der Bearbeitung von Altverträgen.', [
        s('Prüfschritte', ['Tarifgeneration feststellen', 'Umstellungen in der Vertragshistorie prüfen', 'Tarifspezifische Sonderregeln anwenden'], 'Ein fester Prüfablauf verhindert Fehler.'),
        s('Typische Fehler', ['Guthabenzins nach falschem Tarif', 'Vergessene Gebührenerstattung', 'Übersehene Tarifumstellung'], 'Diese Fehler wurden in Experteninterviews am häufigsten genannt.'),
      ], [
        q('Was ist der erste Prüfschritt bei einem Altvertrag?', ['Tarifgeneration feststellen', 'Kündigung vorbereiten', 'Neues Angebot erstellen', 'Prämie beantragen'], 0, 'Ohne Tarifgeneration lassen sich die Bedingungen nicht bestimmen.'),
        q('Welcher Fehler tritt laut Expertinnen und Experten häufig auf?', ['Guthabenzins nach falschem Tarif berechnet', 'Zu viele Beratungsgespräche', 'Falsche Postleitzahl', 'Doppelte Kundennummer'], 0, 'Die Zinsberechnung nach dem falschen Tarif ist der häufigste Fehler.'),
        q('Wo werden Tarifumstellungen dokumentiert?', ['In der Vertragshistorie', 'Im Beratungsprotokoll 2017', 'Im ESIS-Merkblatt', 'Nirgends'], 0, 'Umstellungen sind in der Vertragshistorie nachvollziehbar.'),
      ]),
      chapter('c-t3', 'Gültigkeit von Rundschreiben', 'lektion', 20, 'Historische und aktuelle Regelungen sicher unterscheiden.', [
        s('Gültigkeit erkennen', ['Gültig ab / gültig bis prüfen', 'Nachfolgeregelungen beachten', 'Anwendungsbereich (Neu- vs. Bestandsgeschäft)'], 'Jede Regelung hat einen Gültigkeitszeitraum und einen Anwendungsbereich.'),
      ], [
        q('Was bedeutet der Status „Historisch“ in der Knowledge Base?', ['Die Regelung ist abgelaufen, aber für Altfälle relevant', 'Die Regelung ist aktuell gültig', 'Die Regelung wurde nie angewendet', 'Die Regelung ist geheim'], 0, 'Historische Regelungen gelten nur noch für Altfälle.'),
        q('Was bedeutet „Veraltet“?', ['Durch eine neuere Regelung ersetzt – nicht mehr anwenden', 'Gilt nur für Neukunden', 'Muss noch geprüft werden', 'Gilt nur in Thüringen'], 0, 'Veraltete Regelungen sind ersetzt und nicht mehr anzuwenden.'),
        q('Worauf ist bei Rundschreiben neben dem Datum zu achten?', ['Auf den Anwendungsbereich (Neu- oder Bestandsgeschäft)', 'Auf die Schriftart', 'Auf die Seitenzahl', 'Auf den Verteiler'], 0, 'Viele Rundschreiben gelten nur für das Neugeschäft.'),
      ]),
    ],
  },
  {
    id: 'm-finanzierung',
    title: 'Immobilienfinanzierung',
    description: 'Finanzierungsbausteine und die Rolle des Bausparvertrags in der Kombifinanzierung.',
    category: 'Finanzierung',
    level: 'Fortgeschrittene',
    difficulty: 'Mittel',
    durationMin: 50,
    sourceArticleIds: ['a-kombi'],
    createdAt: '2026-08-12',
    generated: false,
    targetRoles: ['Bausparberatung', 'Kreditanalyse'],
    sourceExperts: ['Jürgen Wolf'],
    seed: true,
    chapters: [
      chapter('c-f1', 'Finanzierungsbausteine', 'video', 20, 'Annuitätendarlehen, Bausparvertrag und Förderdarlehen.', [
        s('Bausteine im Überblick', ['Annuitätendarlehen', 'Bausparvertrag', 'Förderdarlehen (z. B. WIBank)'], 'Eine Finanzierung besteht oft aus mehreren Bausteinen.'),
      ], [
        q('Welcher Baustein bietet frühe Zinssicherheit über die Sparphase hinaus?', ['Bausparvertrag', 'Dispositionskredit', 'Tagesgeld', 'Kreditkarte'], 0, 'Der Bausparvertrag sichert den späteren Darlehenszins.'),
        q('Welche Institution vergibt in Hessen Förderdarlehen für Wohneigentum?', ['Die WIBank', 'Die Bundesbank', 'Die EZB', 'Das Finanzamt'], 0, 'Die WIBank ist die Förderbank des Landes Hessen.'),
        q('Was ist bei Förderprogrammen vor der Beratung zu prüfen?', ['Die aktuell gültigen Programmbedingungen', 'Nur der Zinssatz von 2020', 'Nichts', 'Die Tarifgeneration A'], 0, 'Förderbedingungen ändern sich regelmäßig.'),
      ]),
      chapter('c-f2', 'Bausparvertrag in der Kombifinanzierung', 'praesentation', 30, 'Funktionsweise, Vorteile und Kostenbetrachtung.', [
        s('So funktioniert die Kombifinanzierung', ['Tilgungsfreies Vorausdarlehen', 'Paralleles Bausparen', 'Ablösung nach Zuteilung'], 'Das Bauspardarlehen löst das Vorausdarlehen nach Zuteilung ab.'),
      ], [
        q('Was löst nach Zuteilung das Vorausdarlehen ab?', ['Das Bauspardarlehen', 'Ein KfW-Kredit', 'Die Wohnungsbauprämie', 'Ein Ratenkredit'], 0, 'Das Bauspardarlehen übernimmt die Restfinanzierung.'),
        q('Was ist bei der Beratung zur Kombifinanzierung erforderlich?', ['Transparente Gesamtkostenbetrachtung', 'Nur die Monatsrate nennen', 'Keine Dokumentation', 'Ein Aktienvergleich'], 0, 'Die Gesamtkosten müssen transparent verglichen werden.'),
        q('Welche Kosten fallen während der Sparphase zusätzlich an?', ['Zinsen für das Vorausdarlehen', 'Keine', 'Grunderwerbsteuer doppelt', 'Kontoführung beim Finanzamt'], 0, 'Das Vorausdarlehen verursacht laufende Zinsen.'),
      ]),
    ],
  },
  {
    id: 'm-regulatorik',
    title: 'Regulatorische Anforderungen',
    description: 'Wohnimmobilienkreditrichtlinie, Kreditwürdigkeitsprüfung und Dokumentationspflichten für Expertinnen und Experten.',
    category: 'Regulatorik',
    level: 'Experten',
    difficulty: 'Schwer',
    durationMin: 40,
    sourceArticleIds: ['a-wikr'],
    createdAt: '2026-11-10',
    generated: true,
    format: 'praesentation',
    targetRoles: ['Kreditanalyse', 'Compliance'],
    sourceExperts: ['Dr. Thomas Yilmaz'],
    seed: true,
    chapters: [
      chapter('c-r1', 'Wohnimmobilienkreditrichtlinie', 'praesentation', 20, 'Pflichten bei Immobiliar-Verbraucherdarlehen.', [
        s('Kernpflichten', ['Kreditwürdigkeitsprüfung (§ 505a BGB)', 'ESIS-Merkblatt vor Vertragsschluss', 'Erläuterungspflichten'], 'Seit 21.03.2016 gelten erweiterte Pflichten.'),
      ], [
        q('Seit wann gilt die Umsetzung der Wohnimmobilienkreditrichtlinie?', ['21.03.2016', '01.01.2004', '31.12.2015', '01.04.2024'], 0, 'Die Umsetzung trat am 21.03.2016 in Kraft.'),
        q('Welche Norm regelt die Kreditwürdigkeitsprüfung?', ['§ 505a BGB', '§ 1 KWG', '§ 433 BGB', '§ 10 EStG'], 0, '§ 505a BGB regelt die Pflicht zur Kreditwürdigkeitsprüfung.'),
        q('Welches Dokument erhält die Kundin bzw. der Kunde vor Vertragsschluss?', ['ESIS-Merkblatt', 'Tarifauszug Generation A', 'Prämienbescheid', 'Grundbuchauszug'], 0, 'Das ESIS-Merkblatt ist vorvertraglich auszuhändigen.'),
      ]),
      chapter('c-r2', 'Dokumentations- und Beratungspflichten', 'lektion', 20, 'Nachvollziehbare Dokumentation als Prüfungsgrundlage.', [
        s('Dokumentation', ['Prüfschritte nachvollziehbar festhalten', 'Unterlagen vorhalten', 'Abweichungen begründen'], 'Die Dokumentation ist Grundlage für interne und externe Prüfungen.'),
      ], [
        q('Warum ist eine nachvollziehbare Dokumentation wichtig?', ['Sie ist Grundlage für Prüfungen', 'Sie ersetzt die Beratung', 'Sie ist freiwillig', 'Sie dient nur Marketingzwecken'], 0, 'Prüfungen stützen sich auf die Dokumentation.'),
        q('Was gilt für Abweichungen vom Standardprozess?', ['Sie sind zu begründen und freizugeben', 'Sie sind verboten', 'Sie müssen nicht dokumentiert werden', 'Sie gelten automatisch als genehmigt'], 0, 'Abweichungen erfordern Begründung und Freigabe.'),
        q('Welches Protokoll ist seit April 2024 nicht mehr zu verwenden?', ['Beratungsprotokoll Version 2017', 'ESIS-Merkblatt', 'Beratungsleitfaden 2024', 'Produkthandbuch 2025'], 0, 'Das Protokoll 2017 ist veraltet.'),
      ]),
    ],
  },
]

export const SEED_PROGRESS: LearningProgress = {
  'm-grundlagen': {
    'c-g1': { completed: true, bestScore: 100, attempts: 1, lastAttempt: daysAgo(6) },
    'c-g2': { completed: true, bestScore: 100, attempts: 2, lastAttempt: daysAgo(4) },
  },
  'm-tarife': {
    'c-t1': { completed: true, bestScore: 100, attempts: 1, lastAttempt: daysAgo(2) },
  },
}

/* ---------------------------- Aktivitäten ---------------------------- */

export const SEED_ACTIVITIES: Activity[] = [
  { id: 'act-1', type: 'interview', title: 'Experteninterview abgeschlossen', description: 'Monika Hartmann · Zuteilungsprozess & Bewertungszahl', timestamp: hoursAgo(3), actor: 'Sarah Schneider', link: '/expert-knowledge' },
  { id: 'act-2', type: 'document', title: 'Dokument analysiert', description: 'Foerderrichtlinie_WIBank_Wohneigentum_2025.pdf · 2 mögliche Widersprüche', timestamp: hoursAgo(5), actor: 'Andrea Vogel', link: '/documents' },
  { id: 'act-3', type: 'module', title: 'Lernmodul generiert', description: 'Regulatorische Anforderungen · 2 Kapitel, 6 Quizfragen', timestamp: hoursAgo(20), actor: 'Sarah Schneider', link: '/learning/m-regulatorik' },
  { id: 'act-4', type: 'article', title: 'Wissensartikel aktualisiert', description: 'Grundlagen des Bausparens · Version 3.2', timestamp: daysAgo(2, 15), actor: 'Monika Hartmann', link: '/knowledge-base/a-grundlagen' },
  { id: 'act-5', type: 'quiz', title: 'Quiz bestanden', description: 'Historische Tarifgenerationen · Kapitel 1 mit 100 %', timestamp: daysAgo(2, 11), actor: 'Sarah Schneider', link: '/learning/m-tarife' },
  { id: 'act-6', type: 'document', title: 'Dokument analysiert', description: 'Notizen_Bestandsverwaltung_Altvertraege.txt · 2 Wissenslücken', timestamp: daysAgo(3, 16), actor: 'Frank Richter', link: '/documents' },
  { id: 'act-7', type: 'article', title: 'Prüfung erforderlich', description: 'Förderprogramme Hessen · Gültigkeit endet am 31.12.2026', timestamp: daysAgo(5, 10), actor: 'KI-Gültigkeitsprüfung', link: '/knowledge-base/a-foerder-hessen' },
]

/* ----------------------------- Assistent ----------------------------- */

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-seed',
    title: 'Wohnungsbauprämie Einkommensgrenzen',
    createdAt: daysAgo(1, 14),
    updatedAt: daysAgo(1, 14),
    messages: [
      { id: 'cm-1', role: 'user', text: 'Welche Einkommensgrenzen gelten für die Wohnungsbauprämie?', timestamp: daysAgo(1, 14) },
      {
        id: 'cm-2',
        role: 'assistant',
        text: 'Seit 2021 gelten 35.000 € bzw. 70.000 € zu versteuerndes Einkommen.',
        timestamp: daysAgo(1, 14),
        answer: {
          summary: 'Seit dem Sparjahr 2021 gelten Einkommensgrenzen von 35.000 € (Alleinstehende) bzw. 70.000 € (Zusammenveranlagte). Die früheren Grenzen sind historisch.',
          points: [
            { title: 'Wohnungsbauprämie – Regelung ab 2021', text: 'Die Einkommensgrenzen liegen bei 35.000 € bzw. 70.000 € zu versteuerndem Einkommen.' },
            { title: 'Wohnungsbauprämie – Regelung bis 2020', text: 'Bis 2020 galten 25.600 € bzw. 51.200 €.' },
          ],
          warnings: ['„Wohnungsbauprämie – Regelung bis 2020“ ist historisch und nur für Sparjahre bis 2020 relevant.'],
          sources: [
            { articleId: 'a-wop-2021', title: 'Wohnungsbauprämie – Regelung ab 2021', status: 'aktuell', validFrom: '2021-01-01', validUntil: null, relevance: 100 },
            { articleId: 'a-wop-alt', title: 'Wohnungsbauprämie – Regelung bis 2020', status: 'historisch', validFrom: '2004-01-01', validUntil: '2020-12-31', relevance: 72 },
          ],
          documents: ['Rundschreiben_RS_02-2021_Wohnungsbaupraemie.pdf'],
          confidence: 92,
        },
      },
    ],
  },
]

/* --------------------------- Analytics-Daten --------------------------- */

function lastMonths(n: number): string[] {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')
  })
}

const months = lastMonths(12)
const articleSeries = [702, 738, 781, 829, 868, 912, 961, 1004, 1063, 1121, 1198, 1284]
const documentSeries = [148, 162, 179, 193, 211, 228, 246, 265, 287, 309, 332, 356]
const interviewSeries = [2, 3, 3, 4, 3, 4, 5, 4, 5, 6, 7, 6]
const completionSeries = [51, 53, 54, 56, 57, 59, 60, 62, 63, 65, 67, 68]

export const GROWTH_HISTORY = months.map((month, i) => ({
  month,
  articles: articleSeries[i],
  documents: documentSeries[i],
  interviews: interviewSeries[i],
  completion: completionSeries[i],
}))

export const DEPARTMENT_STATS: { department: Department; short: string; articles: number; gaps: number; coverage: number; completion: number }[] = [
  { department: 'LBS Bausparen', short: 'Bausparen', articles: 318, gaps: 3, coverage: 92, completion: 78 },
  { department: 'LBS Bestandsverwaltung', short: 'Bestand', articles: 241, gaps: 8, coverage: 74, completion: 61 },
  { department: 'Immobilienfinanzierung', short: 'Finanzierung', articles: 226, gaps: 4, coverage: 86, completion: 69 },
  { department: 'WIBank Förderung', short: 'Förderung', articles: 157, gaps: 5, coverage: 81, completion: 64 },
  { department: 'Compliance & Regulatorik', short: 'Compliance', articles: 189, gaps: 2, coverage: 94, completion: 83 },
  { department: 'Vertrieb & Beratung', short: 'Vertrieb', articles: 153, gaps: 2, coverage: 89, completion: 72 },
]
