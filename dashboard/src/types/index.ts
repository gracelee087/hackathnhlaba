/* ------------------------------------------------------------------
   Zentrale Domänenmodelle – so gestaltet, dass später ein echtes
   Backend (REST/GraphQL) dieselben Strukturen liefern kann.
------------------------------------------------------------------- */

export type ValidityStatus = 'aktuell' | 'pruefung' | 'historisch' | 'veraltet'
export type VerificationStatus = 'verifiziert' | 'in_pruefung' | 'ungeprueft'
export type Category = 'Bausparen' | 'Tarife' | 'Finanzierung' | 'Förderung' | 'Prozesse' | 'Regulatorik'
export type Department =
  | 'LBS Bausparen'
  | 'LBS Bestandsverwaltung'
  | 'Immobilienfinanzierung'
  | 'WIBank Förderung'
  | 'Compliance & Regulatorik'
  | 'Vertrieb & Beratung'
export type DocumentType = 'PDF' | 'DOCX' | 'PPTX' | 'TXT'
export type DocumentStatus = 'uploading' | 'processing' | 'analyzed' | 'imported' | 'error'
export type Audience = 'Anfänger' | 'Fortgeschrittene' | 'Experten'
export type Difficulty = 'Leicht' | 'Mittel' | 'Schwer'
export type ContentFormat = 'praesentation' | 'video' | 'podcast' | 'quiz'

export type AppRole = 'knowledge_manager' | 'hr' | 'teamleitung' | 'neu'

export type JobRole =
  | 'Sachbearbeitung Bestandsverwaltung'
  | 'Bausparberatung'
  | 'Kreditanalyse'
  | 'Förderberatung'
  | 'Compliance'
  | 'Teamleitung'
  | 'Personal (HR)'
  | 'Knowledge Management'

export interface User {
  id: string
  name: string
  role: string
  department: Department
  initials: string
  email: string
  appRole: AppRole
  jobRole: JobRole
}

/* -------------------------- Workforce / Kanban -------------------------- */

export type EmployeeStatus = 'aktiv' | 'austritt_geplant' | 'interview' | 'wissen_gesichert' | 'ausgeschieden'

/** Anlass, warum jemand interviewt wird – bestimmt den zuständigen KI-Agenten. */
export type InterviewTrigger = 'ruhestand' | 'austritt' | 'wechsel' | 'projektende' | 'schluesselwissen'
export type ExitReason = 'Ruhestand' | 'Kündigung' | 'Interner Wechsel' | 'Befristung endet' | 'Aufhebungsvertrag'

export interface EmployeeProject {
  name: string
  description: string
}

export interface Employee {
  id: string
  name: string
  initials: string
  title: string
  jobRole: JobRole
  department: Department
  since: string
  yearsOfService: number
  status: EmployeeStatus
  exitDate?: string
  exitReason?: ExitReason
  trigger?: InterviewTrigger
  knowledgeCoverage: number
  criticality: 'hoch' | 'mittel' | 'niedrig'
  projects: EmployeeProject[]
  successorRole?: JobRole
  interviewId?: string
  moduleIds: string[]
  isNewHire?: boolean
}

export interface Expert {
  id: string
  name: string
  role: string
  department: Department
  yearsOfService: number
  retirement: string
  initials: string
  knowledgeCoverage: number
  focus: string
}

/* ---------------------------- Dokumente ---------------------------- */

export interface KeyConcept {
  term: string
  definition: string
}

export interface ImportantDate {
  date: string
  label: string
}

export interface Contradiction {
  id: string
  text: string
  severity: 'hoch' | 'mittel'
  resolved?: boolean
}

export interface DocumentAnalysis {
  suggestedTitle: string
  category: Category
  summary: string
  topics: string[]
  keyConcepts: KeyConcept[]
  importantDates: ImportantDate[]
  validity: { validFrom: string; validUntil: string | null; status: ValidityStatus; note: string }
  contradictions: Contradiction[]
  missingKnowledge: string[]
  source: { author: string; department: Department; pages: number; reference: string; classification: string }
  confidence: number
}

export interface Document {
  id: string
  name: string
  type: DocumentType
  sizeKb: number
  uploadedAt: string
  uploadedBy: string
  department: Department
  status: DocumentStatus
  progress: number
  currentStep: number
  analysis?: DocumentAnalysis
  linkedArticleIds: string[]
  previewText?: string
  error?: string
  seed?: boolean
}

/* -------------------------- Knowledge Base -------------------------- */

export interface ArticleVersion {
  version: string
  date: string
  author: string
  change: string
}

export interface QuizFact {
  question: string
  answer: string
  distractors: string[]
  explanation?: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  description: string
  content: string[]
  category: Category
  department: Department
  sourceDocuments: string[]
  expert: string
  createdAt: string
  updatedAt: string
  validFrom: string
  validUntil: string | null
  status: ValidityStatus
  verification: VerificationStatus
  versions: ArticleVersion[]
  tags: string[]
  origin: 'dokument' | 'interview' | 'manuell'
  supersededBy?: string
  facts?: QuizFact[]
  targetRoles?: JobRole[]
  seed?: boolean
  /** Backend-Artikel aus KI-Interviews */
  interviewId?: string
}

/* --------------------------- Interviews ---------------------------- */

export interface InterviewMessage {
  id: string
  role: 'ai' | 'expert'
  text: string
  timestamp: string
}

export interface InterviewTopic {
  id: string
  label: string
  done: boolean
}

export interface Plausibility {
  /** 0–100: wie gut die Aussage durch Dokumente und bisherige Antworten gedeckt ist */
  score: number
  reasons: string[]
}

export interface ExtractedKnowledge {
  id: string
  statement: string
  topic: string
  confidence: number
  /** neu → validiert; bei niedriger Plausibilität: pruefung → (Führungskraft) validiert | abgelehnt */
  status: 'neu' | 'validiert' | 'pruefung' | 'abgelehnt'
  createdAt: string
  plausibility?: Plausibility
  reviewId?: string
}

export type ReviewStatus = 'offen' | 'bestaetigt' | 'korrigiert' | 'abgelehnt'

/** Vier-Augen-Prüfung einer Interview-Aussage durch die Führungskraft */
export interface ReviewRequest {
  id: string
  interviewId: string
  extractedId: string
  employeeId?: string
  employeeName: string
  department: Department
  reviewerName: string
  topic: string
  statement: string
  question?: string
  plausibility: Plausibility
  status: ReviewStatus
  createdAt: string
  decidedAt?: string
  decidedBy?: string
  comment?: string
  correctedStatement?: string
}

export interface MissingInfo {
  id: string
  label: string
  resolved: boolean
}

export type InterviewScriptId = 'historisch' | 'generisch' | 'projekt'

export interface ExpertInterview {
  id: string
  title: string
  scriptId: InterviewScriptId
  expert: Expert
  employeeId?: string
  projectName?: string
  status: 'aktiv' | 'abgeschlossen'
  startedAt: string
  updatedAt: string
  savedAt?: string
  linkedDocumentId?: string
  linkedDocumentName?: string
  step: number
  messages: InterviewMessage[]
  topics: InterviewTopic[]
  extracted: ExtractedKnowledge[]
  pendingQuestion: string | null
  followUps: string[]
  missingInfo: MissingInfo[]
  contradictions: Contradiction[]
  savedArticleIds: string[]
  seed?: boolean
}

/* ----------------------------- Lernen ------------------------------ */

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Quiz {
  id: string
  title: string
  passingScore: number
  questions: QuizQuestion[]
}

export interface Slide {
  title: string
  bullets: string[]
  notes: string
}

export interface Chapter {
  id: string
  title: string
  type: 'video' | 'praesentation' | 'lektion' | 'podcast'
  durationMin: number
  summary: string
  slides: Slide[]
  quiz: Quiz
}

export interface LearningModule {
  id: string
  title: string
  description: string
  category: Category
  level: Audience
  difficulty: Difficulty
  durationMin: number
  chapters: Chapter[]
  sourceArticleIds: string[]
  createdAt: string
  generated: boolean
  format?: ContentFormat
  targetRoles: JobRole[]
  sourceExperts?: string[]
  seed?: boolean
  /** Backend-Module (nach KI-Interviews generiert): Tags wie "neu" */
  tags?: string[]
  /** Absolute URL eines echten MP4 (anderer Origin) – ersetzt den Szenen-Player */
  videoUrl?: string | null
  interviewId?: string
}

export interface ChapterProgress {
  completed: boolean
  bestScore: number
  attempts: number
  lastAttempt?: string
}

export type LearningProgress = Record<string, Record<string, ChapterProgress>>

/* -------------------------- Content Studio ------------------------- */

export interface VideoScene {
  title: string
  narration: string
  subtitle: string
  durationSec: number
}

export interface PodcastLine {
  speaker: 'Anna' | 'Klaus'
  text: string
}

export interface GeneratedContent {
  id: string
  format: ContentFormat
  title: string
  sourceArticleIds: string[]
  audience: Audience
  difficulty: Difficulty
  createdAt: string
  learningGoals: string[]
  slides: Slide[]
  scenes: VideoScene[]
  podcast: PodcastLine[]
  quiz: QuizQuestion[]
  targetRoles: JobRole[]
  savedModuleId?: string
  tags?: string[]
}

/* ---------------------------- Aktivitäten -------------------------- */

export type ActivityType = 'document' | 'interview' | 'module' | 'article' | 'quiz'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  actor: string
  link?: string
}

/* ---------------------------- Assistent ---------------------------- */

export interface AssistantSource {
  articleId: string
  title: string
  status: ValidityStatus
  validFrom: string
  validUntil: string | null
  relevance: number
}

export interface AssistantAnswer {
  summary: string
  points: { title: string; text: string }[]
  warnings: string[]
  sources: AssistantSource[]
  documents: string[]
  confidence: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
  answer?: AssistantAnswer
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}
