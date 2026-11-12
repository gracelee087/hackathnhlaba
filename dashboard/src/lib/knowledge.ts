import type { Document, ExpertInterview, JobRole, KnowledgeArticle, QuizFact, QuizQuestion } from '@/types'
import { STATUS_META, STATUS_ORDER } from '@/lib/validity'
import { formatDate, nowISO, seededShuffle, todayDate, truncate, uid } from '@/lib/utils'

export function bumpVersion(version: string): string {
  const [major, minor] = version.split('.').map((n) => Number(n) || 0)
  return `${major}.${minor + 1}`
}

function shiftYear(iso: string, years: number): string {
  const d = new Date(iso)
  d.setFullYear(d.getFullYear() + years)
  return formatDate(d.toISOString())
}

/** Leitet automatisch Quizfragen aus den Metadaten eines Artikels ab. */
export function deriveFacts(article: KnowledgeArticle, library: KnowledgeArticle[]): QuizFact[] {
  const facts: QuizFact[] = []
  const statusLabel = STATUS_META[article.status].label
  facts.push({
    question: `Welchen Gültigkeitsstatus hat „${article.title}“ in der Knowledge Base?`,
    answer: statusLabel,
    distractors: STATUS_ORDER.filter((s) => s !== article.status).map((s) => STATUS_META[s].label),
    explanation: STATUS_META[article.status].hint,
  })
  if (article.validUntil) {
    facts.push({
      question: `Bis wann war „${article.title}“ gültig?`,
      answer: formatDate(article.validUntil),
      distractors: [shiftYear(article.validUntil, -2), shiftYear(article.validUntil, 1), shiftYear(article.validUntil, 4)],
      explanation: `Die Regelung war vom ${formatDate(article.validFrom)} bis ${formatDate(article.validUntil)} gültig.`,
    })
  } else {
    facts.push({
      question: `Seit wann gilt „${article.title}“?`,
      answer: formatDate(article.validFrom),
      distractors: [shiftYear(article.validFrom, -3), shiftYear(article.validFrom, 1), shiftYear(article.validFrom, 2)],
      explanation: `Die Regelung gilt seit dem ${formatDate(article.validFrom)}.`,
    })
  }
  const otherExperts = Array.from(new Set(library.map((a) => a.expert).filter((e) => e !== article.expert))).slice(0, 3)
  if (otherExperts.length === 3) {
    facts.push({
      question: `Wer hat das Fachwissen zu „${article.title}“ beigetragen?`,
      answer: article.expert,
      distractors: otherExperts,
      explanation: `${article.expert} ist als Expertin bzw. Experte für diesen Artikel hinterlegt.`,
    })
  }
  return facts
}

export function factsToQuestions(facts: QuizFact[], seed: string, count: number): QuizQuestion[] {
  const unique = facts.filter((f, i, arr) => arr.findIndex((x) => x.question === f.question) === i)
  return unique.slice(0, count).map((fact) => {
    const options = seededShuffle([fact.answer, ...fact.distractors.slice(0, 3)], `${seed}:${fact.question}`)
    return {
      id: uid('q'),
      question: fact.question,
      options,
      correctIndex: options.indexOf(fact.answer),
      explanation: fact.explanation ?? `Richtig ist: ${fact.answer}.`,
    }
  })
}

/** Erstellt aus einer Dokumentanalyse einen neuen Knowledge-Base-Artikel. */
export function buildArticleFromDocument(doc: Document): KnowledgeArticle {
  const a = doc.analysis
  if (!a) throw new Error('Dokument wurde noch nicht analysiert')
  const created = todayDate()
  const concepts = a.keyConcepts.map((k) => `${k.term}: ${k.definition}`)
  const facts: QuizFact[] = a.keyConcepts.map((k, i, all) => ({
    question: `Was beschreibt der Begriff „${k.term}“?`,
    answer: truncate(k.definition, 120),
    distractors: [
      ...all.filter((_, j) => j !== i).map((x) => truncate(x.definition, 120)),
      'Eine interne Kostenstelle der Bestandsverwaltung.',
      'Ein Formular zur Beantragung der Wohnungsbauprämie.',
      'Die Kennzahl für die Kundenzufriedenheit.',
    ].slice(0, 3),
  }))
  return {
    id: uid('a'),
    title: a.suggestedTitle,
    description: truncate(a.summary, 160),
    content: [a.summary, ...concepts, `Gültigkeit: ${a.validity.note}`],
    category: a.category,
    department: a.source.department,
    sourceDocuments: [doc.name],
    expert: a.source.author,
    createdAt: created,
    updatedAt: created,
    validFrom: a.validity.validFrom,
    validUntil: a.validity.validUntil,
    status: a.validity.status,
    verification: a.validity.status === 'aktuell' ? 'verifiziert' : 'in_pruefung',
    versions: [{ version: '1.0', date: created, author: 'KI-Dokumentanalyse · Sarah Schneider', change: `Aus ${doc.name} übernommen` }],
    tags: a.topics.slice(0, 5),
    origin: 'dokument',
    facts,
  }
}

const HISTORIC_INTERVIEW_FACTS: QuizFact[] = [
  {
    question: 'Nach welchem Tarif ist der Guthabenzins bei Altverträgen zu berechnen?',
    answer: 'Nach dem bei Vertragsabschluss vereinbarten Vertragstarif',
    distractors: ['Nach dem aktuell gültigen Tarif', 'Nach dem Durchschnitt aller Tarife', 'Nach Vorgabe des letzten Rundschreibens'],
    explanation: 'Laut Experteninterview ist die Berechnung nach dem aktuellen Tarif ein häufiger Fehler.',
  },
  {
    question: 'Für welche Verträge gilt das Rundschreiben RS 07/2015 laut Experteninterview?',
    answer: 'Nur für Neuabschlüsse',
    distractors: ['Für alle Bestandsverträge', 'Nur für Verträge der Generation A', 'Nur für Verträge mit Darlehensverzicht'],
    explanation: 'Für Bestandsverträge bleiben die Classic-Bedingungen bis Vertragsende maßgeblich.',
  },
  {
    question: 'Was wird bei Darlehensverzicht in Classic-Verträgen häufig vergessen?',
    answer: 'Die Erstattung der Abschlussgebühr',
    distractors: ['Die Bonitätsprüfung', 'Der Antrag auf Wohnungsbauprämie', 'Die Grundschuldbestellung'],
  },
]

const PROJECT_INTERVIEW_FACTS: QuizFact[] = [
  {
    question: 'Womit beginnt die Prüfung eines Altvertrags laut Projektwissen?',
    answer: 'Vertrag aufrufen und Tarifgeneration bestimmen',
    distractors: ['Direkt die Rechtsabteilung einschalten', 'Kunden anrufen', 'Neuen Vertrag anlegen'],
    explanation: 'Erst wenn die Tarifgeneration feststeht, kann die Checkliste korrekt angewendet werden.',
  },
  {
    question: 'Welche Fälle gehen seit 2022 noch an die Rechtsabteilung?',
    answer: 'Nur Tarifumstellungen vor 2010',
    distractors: ['Alle Tarifumstellungen', 'Keine Fälle mehr', 'Nur Verträge ab 2016'],
    explanation: 'Die Regel im Prozesshandbuch ist veraltet – Fälle ab 2010 prüft das Team selbst.',
  },
  {
    question: 'Was ist laut Experteninterview die häufigste Stolperfalle?',
    answer: 'Ein falsch berechneter Guthabenzins bei Altverträgen',
    distractors: ['Fehlende Unterschrift im Antrag', 'Falsche Postleitzahl', 'Doppelte Kundennummer'],
  },
  {
    question: 'Wo liegt die Prüfmatrix für Altverträge?',
    answer: 'Im Team-SharePoint',
    distractors: ['Im Beratungsprotokoll 2017', 'Auf einem lokalen USB-Stick', 'Im ESIS-Merkblatt'],
  },
]

/** Überführt die validierten Aussagen eines Interviews in einen Wissensartikel. */
export function buildArticleFromInterview(interview: ExpertInterview, existing?: KnowledgeArticle, targetRoles?: JobRole[]): KnowledgeArticle {
  const today = todayDate()
  const accepted = interview.extracted.filter((e) => e.status !== 'abgelehnt')
  const allValidated = accepted.length > 0 && accepted.every((e) => e.status === 'validiert')
  const openContradictions = interview.contradictions.some((c) => !c.resolved)
  const verified = allValidated && !openContradictions
  const historic = interview.scriptId === 'historisch'
  const project = interview.scriptId === 'projekt'
  const content = accepted.map((e) => `${e.topic}: ${e.statement}${e.status === 'pruefung' ? ' (in Prüfung durch Führungskraft)' : ''}`)
  const base: KnowledgeArticle = existing ?? {
    id: uid('a'),
    title: historic
      ? 'Bearbeitung historischer Bausparverträge'
      : project
        ? `Projektwissen: ${interview.projectName ?? interview.title} (${interview.expert.name})`
        : `${interview.title} – Erfahrungswissen`,
    description: '',
    content: [],
    category: historic ? 'Tarife' : 'Prozesse',
    department: interview.expert.department,
    sourceDocuments: [],
    expert: interview.expert.name,
    createdAt: today,
    updatedAt: today,
    validFrom: today,
    validUntil: null,
    status: 'pruefung',
    verification: 'in_pruefung',
    versions: [],
    tags: [],
    origin: 'interview',
  }
  const lastVersion = base.versions[0]?.version
  return {
    ...base,
    description: `Erfahrungswissen von ${interview.expert.name} (${interview.expert.role}), erfasst im KI-Experteninterview.`,
    content,
    sourceDocuments: [
      ...(interview.linkedDocumentName ? [interview.linkedDocumentName] : []),
      `Interviewprotokoll ${interview.expert.name} (${formatDate(interview.startedAt)})`,
    ],
    updatedAt: today,
    status: verified ? 'aktuell' : 'pruefung',
    verification: verified ? 'verifiziert' : 'in_pruefung',
    tags: interview.topics.filter((t) => t.done).map((t) => t.label),
    facts: historic ? HISTORIC_INTERVIEW_FACTS : project ? PROJECT_INTERVIEW_FACTS : undefined,
    targetRoles: targetRoles ?? base.targetRoles,
    versions: [
      {
        version: lastVersion ? bumpVersion(lastVersion) : '1.0',
        date: nowISO().slice(0, 10),
        author: `KI-Interview · ${interview.expert.name}`,
        change: lastVersion ? 'Interview-Ergebnisse aktualisiert' : 'Aus Experteninterview erstellt',
      },
      ...base.versions,
    ],
  }
}
