/* ------------------------------------------------------------------
   Simulierter KI-Service.
   Alle Seiten sprechen ausschließlich über das Interface `AIService`.
   Für ein echtes Backend genügt eine zweite Implementierung (z. B.
   `httpAIService`), die dieselben Methoden per fetch() bereitstellt.
------------------------------------------------------------------- */
import type {
  AssistantAnswer,
  Audience,
  Category,
  ContentFormat,
  Difficulty,
  DocumentAnalysis,
  JobRole,
  DocumentType,
  ExpertInterview,
  GeneratedContent,
  KnowledgeArticle,
  PodcastLine,
  Plausibility,
  Slide,
} from '@/types'
import { INTERVIEW_SCRIPTS } from '@/services/interview-scripts'
import { createHttpAIService } from '@/services/http-ai-service'
import { deriveFacts, factsToQuestions } from '@/lib/knowledge'
import { slidesToScenes } from '@/lib/content'
import { assessPlausibility } from '@/lib/plausibility'
import { STATUS_META, isHistoric, validityRange } from '@/lib/validity'
import { firstSentence, hashString, nowISO, sleep, todayDate, truncate, uid } from '@/lib/utils'

export const ANALYSIS_STEPS = [
  'Dokument wird eingelesen',
  'Inhalte werden extrahiert',
  'Themen und Fachbegriffe werden erkannt',
  'Zusammenhänge werden identifiziert',
  'Gültigkeitszeiträume werden analysiert',
  'Wissenslücken werden erkannt',
  'Ergebnisse werden strukturiert',
]

export const GENERATION_STEPS = [
  'Wissensquellen werden ausgewertet',
  'Lernziele werden abgeleitet',
  'Inhalte werden zielgruppengerecht strukturiert',
  'Format wird erstellt',
  'Qualitäts- und Gültigkeitsprüfung',
]

export interface AnalyzeInput {
  name: string
  type: DocumentType
  previewText?: string
  /** Originaldatei – wird an das Backend gesendet (beim Demo-Dokument nicht vorhanden) */
  file?: File
}

export interface InterviewReply {
  reply: string
  extracted?: { statement: string; topic: string; confidence: number; plausibility?: Plausibility }
  resolveMissing: string[]
  topicDone?: string
  contradiction?: { text: string; severity: 'hoch' | 'mittel' }
  resolveContradictions?: boolean
  followUp?: string
  finished?: boolean
}

export interface GenerateRequest {
  articles: KnowledgeArticle[]
  library: KnowledgeArticle[]
  format: ContentFormat
  audience: Audience
  difficulty: Difficulty
  targetRoles: JobRole[]
}

export interface AIService {
  analyzeDocument(input: AnalyzeInput): Promise<DocumentAnalysis>
  interviewReply(interview: ExpertInterview, expertText: string): Promise<InterviewReply>
  generateContent(request: GenerateRequest): Promise<GeneratedContent>
  ask(question: string, articles: KnowledgeArticle[]): Promise<AssistantAnswer>
}

/* --------------------------- Dokumentanalyse --------------------------- */

const HISTORIC_RE = /(bauspar|tarif|classic|altvertr|histor)/i
const FOERDER_RE = /(f(ö|oe)rder|wibank|pr(ä|ae)mie|zulage)/i

function cleanTitle(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function estimatePages(name: string) {
  return 4 + (hashString(name) % 36)
}

function historicAnalysis(name: string): DocumentAnalysis {
  return {
    suggestedTitle: 'Tarifbedingungen Classic 2004',
    category: 'Tarife',
    summary:
      'Das Dokument beschreibt die Tarifbedingungen der Tarifgeneration Classic 2004 (Demo-Tarif). Es regelt Guthabenverzinsung, Abschlussgebühr, Zuteilungsvoraussetzungen sowie Sonderregelungen bei Darlehensverzicht. Die Bedingungen galten für Neuabschlüsse vom 01.01.2004 bis 31.12.2015 und sind für Bestandsverträge weiterhin relevant.',
    topics: ['Bauspartarife', 'Classic 2004', 'Guthabenverzinsung', 'Abschlussgebühr', 'Zuteilung', 'Bestandsverträge'],
    keyConcepts: [
      { term: 'Guthabenzins', definition: 'Tariflich festgelegte Verzinsung des Bausparguthabens während der Sparphase.' },
      { term: 'Abschlussgebühr', definition: 'Bei Vertragsabschluss fällige Gebühr in Prozent der Bausparsumme.' },
      { term: 'Darlehensverzicht', definition: 'Verzicht auf das Bauspardarlehen nach Zuteilung – kann tarifliche Bonusregelungen auslösen.' },
      { term: 'Tarifumstellung', definition: 'Wechsel eines Bestandsvertrags in eine neuere Tarifgeneration.' },
    ],
    importantDates: [
      { date: '2004-01-01', label: 'Inkrafttreten der Tarifbedingungen' },
      { date: '2010-07-01', label: 'Option zur Tarifumstellung eingeführt' },
      { date: '2015-12-31', label: 'Ende Neuabschluss laut RS 07/2015' },
      { date: '2017-02-21', label: 'BGH-Urteil zum Kündigungsrecht' },
    ],
    validity: {
      validFrom: '2004-01-01',
      validUntil: '2015-12-31',
      status: 'historisch',
      note: 'Historische Regelung: gültig für Neuabschlüsse bis 31.12.2015. Für Bestandsverträge ggf. weiterhin maßgeblich – Klärung im Experteninterview empfohlen.',
    },
    contradictions: [
      { id: uid('con'), text: 'Abschnitt 4.2 nennt eine Erstattung der Abschlussgebühr bei Darlehensverzicht – das Rundschreiben RS 07/2015 erwähnt diese Regelung nicht mehr.', severity: 'hoch' },
      { id: uid('con'), text: 'Das Dokument enthält keine Befristung, während RS 07/2015 ein Gültigkeitsende zum 31.12.2015 festlegt.', severity: 'mittel' },
    ],
    missingKnowledge: [
      'Anwendung der Bedingungen auf Bestandsverträge nach 2015',
      'Ausnahmen bei Tarifumstellungen',
      'Praktische Prüfroutine in der Bestandsverwaltung',
      'Typische Bearbeitungsfehler',
    ],
    source: { author: 'Produktmanagement LBS', department: 'LBS Bestandsverwaltung', pages: estimatePages(name), reference: 'TB-C2004 / Fassung 03', classification: 'Intern' },
    confidence: 0.93,
  }
}

function foerderAnalysis(name: string): DocumentAnalysis {
  return {
    suggestedTitle: `Förderhinweise: ${cleanTitle(name)}`,
    category: 'Förderung',
    summary: `Das Dokument „${cleanTitle(name)}“ enthält Förderbedingungen, Antragsvoraussetzungen und Fristen. Die KI hat Fördersätze und Einkommensgrenzen mit der Knowledge Base abgeglichen.`,
    topics: ['Förderung', 'Antragsvoraussetzungen', 'Einkommensgrenzen', 'Fristen'],
    keyConcepts: [
      { term: 'Einkommensgrenze', definition: 'Maximales zu versteuerndes Einkommen für den Förderanspruch.' },
      { term: 'Antragsfrist', definition: 'Zeitraum, in dem die Förderung beantragt werden muss.' },
    ],
    importantDates: [{ date: todayDate(), label: 'Analysezeitpunkt' }],
    validity: { validFrom: `${new Date().getFullYear()}-01-01`, validUntil: null, status: 'pruefung', note: 'Fördersätze ändern sich regelmäßig – fachliche Freigabe erforderlich.' },
    contradictions: [{ id: uid('con'), text: 'Genannte Einkommensgrenzen weichen von „Wohnungsbauprämie – Regelung ab 2021“ ab.', severity: 'mittel' }],
    missingKnowledge: ['Gültigkeitsende der Förderbedingungen', 'Zuständige Fachabteilung'],
    source: { author: 'Unbekannt', department: 'WIBank Förderung', pages: estimatePages(name), reference: cleanTitle(name), classification: 'Intern' },
    confidence: 0.84,
  }
}

function genericAnalysis(name: string, previewText?: string): DocumentAnalysis {
  const title = cleanTitle(name)
  const text = previewText?.trim()
  const words = (text || title).toLowerCase().match(/[a-zäöüß]{6,}/g) ?? []
  const freq = new Map<string, number>()
  words.forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1))
  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1))
  const topics = top.length ? top : ['Prozesswissen', 'Fachliche Vorgaben']
  const yearMatch = name.match(/(19|20)\d{2}/)
  const year = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear()
  const historic = year < 2020
  return {
    suggestedTitle: title,
    category: 'Prozesse',
    summary: text
      ? `${truncate(firstSentence(text), 220)} Die KI hat das Dokument in Abschnitte gegliedert und mit ${topics.length} Themen der Knowledge Base verknüpft.`
      : `Das Dokument „${title}“ wurde vollständig eingelesen. Die KI hat ${topics.length} Themenbereiche erkannt und Inhalte für die Übernahme in die Knowledge Base vorbereitet.`,
    topics,
    keyConcepts: topics.slice(0, 3).map((t) => ({
      term: t,
      definition: 'Im Dokument mehrfach verwendeter Fachbegriff. Die Definition wurde aus dem Kontext abgeleitet und sollte fachlich bestätigt werden.',
    })),
    importantDates: [
      { date: `${year}-01-01`, label: 'Frühestes im Dokument genanntes Datum' },
      { date: todayDate(), label: 'Analyse durchgeführt' },
    ],
    validity: historic
      ? { validFrom: `${year}-01-01`, validUntil: `${Math.min(year + 5, 2023)}-12-31`, status: 'historisch', note: 'Das Dokument enthält Jahresangaben vor 2020. Prüfen Sie, ob die Inhalte durch neuere Regelungen ersetzt wurden.' }
      : { validFrom: `${year}-01-01`, validUntil: null, status: 'pruefung', note: 'Keine explizite Befristung gefunden. Fachliche Freigabe empfohlen.' },
    contradictions: historic
      ? [{ id: uid('con'), text: `Jahresangabe ${year} deutet auf eine ältere Fassung hin – eine aktuellere Version könnte existieren.`, severity: 'mittel' }]
      : [],
    missingKnowledge: ['Verantwortliche Fachabteilung bestätigen', 'Gültigkeitszeitraum fachlich freigeben', 'Praxisbeispiele aus der Bearbeitung ergänzen'],
    source: { author: 'Hochgeladen durch Sarah Schneider', department: 'LBS Bausparen', pages: estimatePages(name), reference: title, classification: 'Intern' },
    confidence: text ? 0.82 : 0.78,
  }
}

/* -------------------------------- Interview -------------------------------- */

function freeReply(text: string): string {
  const t = text.toLowerCase()
  if (/zins|gebühr|kosten/.test(t)) return 'Danke für die Ergänzung zu Zinsen und Gebühren. Gibt es dazu ein Rechenbeispiel, das wir in ein Lernmodul übernehmen können?'
  if (/frist|termin|datum|gültig|seit|bis/.test(t)) return 'Ich habe die zeitliche Angabe erfasst und der Gültigkeitsprüfung zugeordnet. Ab wann genau gilt diese Regelung?'
  if (/ausnahme|sonderfall|besonder/.test(t)) return 'Sonderfälle sind besonders wertvoll. Wie häufig tritt dieser Fall ungefähr auf, und woran erkennt man ihn?'
  return 'Danke, ich habe die Information als zusätzliche Wissenseinheit erfasst. Möchten Sie noch etwas ergänzen?'
}

/* ----------------------------- Content-Generierung ----------------------------- */

const AUDIENCE_VERB: Record<Audience, string> = {
  Anfänger: 'Grundlagen verstehen:',
  Fortgeschrittene: 'Sicher anwenden:',
  Experten: 'Sonderfälle beurteilen:',
}

function noteFor(article: KnowledgeArticle, audience: Audience): string {
  const lead = firstSentence(article.content[0] ?? article.description)
  const range = validityRange(article.validFrom, article.validUntil)
  if (audience === 'Anfänger') return `In diesem Abschnitt geht es um „${article.title}“. Einfach gesagt: ${lead}`
  if (audience === 'Fortgeschrittene') return `${lead} Achten Sie in der Praxis darauf, welche Fassung für den konkreten Vertrag maßgeblich ist (Gültigkeit: ${range}).`
  return `${lead} Prüfen Sie Sonderfälle und Übergangsregelungen. Gültigkeit: ${range}. Quelle: ${article.sourceDocuments[0] ?? 'Knowledge Base'}.`
}

function buildSlides(articles: KnowledgeArticle[], audience: Audience, difficulty: Difficulty, title: string, goals: string[]): Slide[] {
  const bulletCount = audience === 'Anfänger' ? 2 : audience === 'Fortgeschrittene' ? 3 : 4
  const slides: Slide[] = [
    {
      title,
      bullets: [`Zielgruppe: ${audience}`, `Schwierigkeitsgrad: ${difficulty}`, `${articles.length} Wissensquelle(n) aus der Knowledge Base`],
      notes: `Willkommen zu diesem Lernmodul. Es basiert auf geprüftem Wissen der Organisation und ist für ${audience} aufbereitet.`,
    },
    { title: 'Lernziele', bullets: goals, notes: 'Nach diesem Modul können Sie die folgenden Lernziele sicher erreichen.' },
    ...articles.map((a) => ({
      title: a.title,
      bullets: [
        ...a.content.slice(0, bulletCount).map((c) => truncate(firstSentence(c), 120)),
        ...(audience === 'Experten' ? [`Quelle: ${a.sourceDocuments[0] ?? 'Knowledge Base'}`] : []),
      ],
      notes: noteFor(a, audience),
    })),
  ]
  if (articles.some((a) => a.status !== 'aktuell')) {
    slides.push({
      title: 'Historisch vs. aktuell',
      bullets: articles.map((a) => `${a.title}: ${STATUS_META[a.status].label} (${validityRange(a.validFrom, a.validUntil)})`),
      notes: 'Achten Sie immer darauf, welche Fassung einer Regelung für den konkreten Fall maßgeblich ist. Historische Regelungen gelten nur für Altfälle.',
    })
  }
  slides.push({
    title: 'Zusammenfassung',
    bullets: articles.map((a) => truncate(a.description, 110)),
    notes: 'Fassen wir zusammen: Die wichtigsten Punkte finden Sie hier noch einmal kompakt. Testen Sie Ihr Wissen anschließend im Quiz.',
  })
  return slides
}

function buildPodcast(articles: KnowledgeArticle[], title: string): PodcastLine[] {
  const lines: PodcastLine[] = [
    { speaker: 'Anna', text: `Herzlich willkommen zum Wissens-Podcast. Heute geht es um „${title}“. Bei mir ist Klaus aus der Fachabteilung.` },
    { speaker: 'Klaus', text: 'Hallo Anna, danke für die Einladung. Das Thema begegnet uns im Alltag ständig – deshalb lohnt sich ein genauer Blick.' },
  ]
  for (const a of articles) {
    lines.push({ speaker: 'Anna', text: `Starten wir mit „${a.title}“. Worum geht es dabei genau?` })
    lines.push({ speaker: 'Klaus', text: firstSentence(a.content[0] ?? a.description) })
    if (a.content[1]) {
      lines.push({ speaker: 'Anna', text: 'Und worauf muss man in der Praxis besonders achten?' })
      lines.push({ speaker: 'Klaus', text: firstSentence(a.content[1]) })
    }
    if (isHistoric(a.status)) {
      lines.push({ speaker: 'Anna', text: 'Gilt das heute noch?' })
      lines.push({ speaker: 'Klaus', text: `Wichtiger Punkt: Diese Regelung ist ${STATUS_META[a.status].label.toLowerCase()} – gültig ${validityRange(a.validFrom, a.validUntil)}. Sie ist nur noch für Altfälle relevant.` })
    }
  }
  lines.push({ speaker: 'Anna', text: 'Vielen Dank, Klaus. Zum Abschluss: Testet euer Wissen im Quiz der Learning Academy!' })
  return lines
}

/* --------------------------------- Assistent --------------------------------- */

const STOP_WORDS = new Set(
  'welche welcher welches was wie wann muss ich bei der die das und oder mit für von zu den dem ein eine einen ist sind gibt es berücksichtigen beachten im in auf an wir sie man kann können habe hat zum zur nach über unter mir mich bitte gilt gelten aktuell aktuellen'.split(' '),
)

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-zäöüß0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
    .map((t) => t.replace(/(en|er|es|e|n|s)$/, ''))
    .filter((t) => t.length > 2)
}

function scoreArticle(article: KnowledgeArticle, tokens: string[]): number {
  const title = article.title.toLowerCase()
  const tags = article.tags.join(' ').toLowerCase()
  const body = `${article.description} ${article.content.join(' ')}`.toLowerCase()
  return tokens.reduce((sum, t) => sum + (title.includes(t) ? 3 : 0) + (tags.includes(t) ? 2 : 0) + (body.includes(t) ? 1 : 0), 0)
}

/* ------------------------------- Implementierung ------------------------------- */

export const mockAIService: AIService = {
  async analyzeDocument({ name, previewText }) {
    await sleep(300)
    const haystack = `${name} ${previewText ?? ''}`
    if (HISTORIC_RE.test(haystack)) return historicAnalysis(name)
    if (FOERDER_RE.test(haystack)) return foerderAnalysis(name)
    return genericAnalysis(name, previewText)
  },

  async interviewReply(interview, expertText) {
    await sleep(900 + (hashString(expertText) % 600))
    const script = INTERVIEW_SCRIPTS[interview.scriptId]
    const step = script.steps[interview.step]
    const statement = truncate(expertText.replace(/\s+/g, ' ').trim(), 420)
    const confidence = 0.8 + (hashString(statement) % 16) / 100
    if (step) {
      const topic = script.topics.find((t) => t.id === step.topicId)?.label ?? 'Erfahrungswissen'
      return {
        reply: step.reply,
        extracted: { statement, topic, confidence, plausibility: assessPlausibility(expertText, step.contradiction?.text) },
        resolveMissing: step.resolve,
        topicDone: step.topicId,
        contradiction: step.contradiction,
        resolveContradictions: step.resolveContradictions,
        followUp: step.followUp,
        finished: step.finished,
      }
    }
    return {
      reply: freeReply(expertText),
      extracted: { statement, topic: 'Ergänzung', confidence, plausibility: assessPlausibility(expertText) },
      resolveMissing: [],
    }
  },

  async generateContent({ articles, library, format, audience, difficulty, targetRoles }) {
    await sleep(250)
    if (!articles.length) throw new Error('Bitte wählen Sie mindestens eine Wissensquelle aus.')
    const title =
      articles.length === 1 ? articles[0].title : `${Array.from(new Set(articles.map((a) => a.category))).join(' & ')}: ${articles.length} Themen kompakt`
    const goals = articles.map((a) => `${AUDIENCE_VERB[audience]} ${a.title}`)
    const slides = buildSlides(articles, audience, difficulty, title, goals)
    const count = difficulty === 'Leicht' ? 4 : difficulty === 'Mittel' ? 6 : 8
    const own = articles.flatMap((a) => a.facts ?? [])
    const derived = articles.flatMap((a) => deriveFacts(a, library))
    const quiz = factsToQuestions([...own, ...derived], `${title}-${difficulty}`, count)
    return {
      id: uid('gc'),
      format,
      title,
      sourceArticleIds: articles.map((a) => a.id),
      audience,
      difficulty,
      createdAt: nowISO(),
      learningGoals: goals,
      slides,
      scenes: slidesToScenes(slides),
      podcast: buildPodcast(articles, title),
      quiz,
      targetRoles,
    }
  },

  async ask(question, articles) {
    await sleep(1100)
    const tokens = tokenize(question)
    const ranked = articles
      .map((article) => ({ article, score: scoreArticle(article, tokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)

    if (!ranked.length) {
      return {
        summary: 'Zu dieser Frage wurde in der Knowledge Base kein passender, freigegebener Wissensartikel gefunden.',
        points: [
          { title: 'Empfehlung', text: 'Starten Sie ein Experteninterview oder laden Sie ein relevantes Dokument in Document Intelligence hoch, um diese Wissenslücke zu schließen.' },
        ],
        warnings: [],
        sources: [],
        documents: [],
        confidence: 28,
      }
    }

    const max = ranked[0].score
    const top = ranked[0].article
    const byId = new Map(articles.map((a) => [a.id, a]))
    const warnings = ranked.flatMap(({ article: a }) => {
      if (a.status === 'historisch') return [`„${a.title}“ ist eine historische Regelung (gültig ${validityRange(a.validFrom, a.validUntil)}). Nur für Altfälle bzw. Bestandsverträge anwenden.`]
      if (a.status === 'veraltet') {
        const successor = a.supersededBy ? byId.get(a.supersededBy)?.title : undefined
        return [`„${a.title}“ ist veraltet${successor ? ` und wurde durch „${successor}“ ersetzt` : ''}. Nicht mehr anwenden.`]
      }
      if (a.status === 'pruefung') return [`„${a.title}“ befindet sich in fachlicher Prüfung – Aussage vor Verwendung bestätigen.`]
      return []
    })
    const confidence = Math.max(35, Math.min(95, 60 + max * 3 - (top.status === 'aktuell' ? 0 : 10)))
    return {
      summary: `${top.description} Die Antwort stützt sich auf ${ranked.length} Wissensartikel der Knowledge Base${warnings.length ? ' – bitte beachten Sie die Gültigkeitshinweise' : ''}.`,
      points: ranked.map(({ article: a }) => ({ title: a.title, text: truncate(a.content.slice(0, 2).join(' '), 300) })),
      warnings,
      sources: ranked.map(({ article: a, score }) => ({
        articleId: a.id,
        title: a.title,
        status: a.status,
        validFrom: a.validFrom,
        validUntil: a.validUntil,
        relevance: Math.round((score / max) * 100),
      })),
      documents: Array.from(new Set(ranked.flatMap((r) => r.article.sourceDocuments))).slice(0, 5),
      confidence,
    }
  },
}

/**
 * Zentrale Instanz. Umschalten über die .env-Datei:
 *   VITE_AI_MODE=mock     → simulierte KI (Standard)
 *   VITE_AI_MODE=backend  → euer Backend (siehe API.md)
 */
export const AI_MODE: 'mock' | 'backend' = import.meta.env.VITE_AI_MODE === 'backend' ? 'backend' : 'mock'
export const aiService: AIService = AI_MODE === 'backend' ? createHttpAIService(mockAIService) : mockAIService

export function categoryForArticles(articles: KnowledgeArticle[]): Category {
  return articles[0]?.category ?? 'Prozesse'
}
