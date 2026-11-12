import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  Activity,
  Conversation,
  Document,
  Employee,
  EmployeeStatus,
  ExpertInterview,
  GeneratedContent,
  InterviewScriptId,
  KnowledgeArticle,
  LearningModule,
  LearningProgress,
  ReviewRequest,
  ReviewStatus,
  User,
  InterviewTrigger,
} from '@/types'
import {
  SEED_ACTIVITIES,
  SEED_EMPLOYEES,
  USERS,
  employeeToExpert,
  SEED_ARTICLES,
  SEED_CONVERSATIONS,
  SEED_DOCUMENTS,
  SEED_INTERVIEWS,
  SEED_MODULES,
  SEED_PROGRESS,
} from '@/data/mock-data'
import { SEED_CONTENTS } from '@/data/seed-contents'
import { buildArticleFromDocument, buildArticleFromInterview, bumpVersion } from '@/lib/knowledge'
import { applyInterviewReply, createInterviewRecord } from '@/lib/interview'
import { DEPARTMENT_HEADS, assessPlausibility } from '@/lib/plausibility'
import type { InterviewReply } from '@/services/ai-service'
import { buildModuleFromContent } from '@/lib/content'
import { fetchRemoteArticles, fetchRemoteModules } from '@/services/learning-remote'
import { PASSING_SCORE } from '@/lib/learning'
import { EMPLOYEE_STATUS_META, can as canUser, type Permission } from '@/lib/permissions'
import { TRIGGER_META } from '@/lib/triggers'
import { nowISO, todayDate, uid } from '@/lib/utils'

const STORAGE_KEY = 'hki.demo-state'
const STATE_VERSION = 6

export interface AppState {
  version: number
  documents: Document[]
  articles: KnowledgeArticle[]
  interviews: ExpertInterview[]
  modules: LearningModule[]
  contents: GeneratedContent[]
  progress: LearningProgress
  activities: Activity[]
  conversations: Conversation[]
  notificationsReadAt: string
  sidebarCollapsed: boolean
  employees: Employee[]
  currentUserId: string
  reviews: ReviewRequest[]
}

export type NewActivity = Omit<Activity, 'id' | 'timestamp' | 'actor'> & { actor?: string }

function buildReview(interview: ExpertInterview, ek: ExpertInterview['extracted'][number], employee?: Employee): ReviewRequest {
  // Frage = letzte KI-Nachricht VOR der Expertenantwort, aus der die Aussage stammt
  let answerIndex = -1
  interview.messages.forEach((m, i) => {
    if (m.role === 'expert' && ek.statement.startsWith(m.text.replace(/\s+/g, ' ').trim().slice(0, 40))) answerIndex = i
  })
  const before = answerIndex >= 0 ? interview.messages.slice(0, answerIndex) : interview.messages
  const lastQuestion = [...before].reverse().find((m) => m.role === 'ai')
  return {
    id: uid('rev'),
    interviewId: interview.id,
    extractedId: ek.id,
    employeeId: employee?.id,
    employeeName: interview.expert.name,
    department: interview.expert.department,
    reviewerName: DEPARTMENT_HEADS[interview.expert.department],
    topic: ek.topic,
    statement: ek.statement,
    question: lastQuestion?.text,
    plausibility: ek.plausibility ?? { score: 0, reasons: [] },
    status: 'offen',
    createdAt: ek.createdAt,
  }
}

function seedEmployeeInterviews(employees: Employee[]): { employees: Employee[]; interviews: ExpertInterview[]; reviews: ReviewRequest[] } {
  const interviews: ExpertInterview[] = []
  const reviews: ReviewRequest[] = []
  const updated = employees.map((e) => {
    if (e.status !== 'interview' || e.interviewId) return e
    const rec = createInterviewRecord(employeeToExpert(e), 'projekt', undefined, { employeeId: e.id, projectName: e.projects[0]?.name })
    let interview: ExpertInterview = { ...rec, id: `i-${e.id}`, seed: true }
    if (e.id === 'e-roth') {
      const answer = 'Ich glaube, Auszahlungen gehen eigentlich ohne zweite Prüfung durch, solange der Betrag unter 50.000 € liegt.'
      const contradiction = 'Auszahlungsrichtlinie 2025 verlangt eine Vier-Augen-Prüfung ab 20.000 €.'
      interview = applyInterviewReply(
        { ...interview, messages: [...interview.messages, { id: uid('msg'), role: 'expert', text: answer, timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }] },
        {
          reply: 'Danke. Mir fällt eine Abweichung zur Auszahlungsrichtlinie 2025 auf. Welche Werkzeuge und Freigaben nutzen Sie im Auszahlungsprozess konkret?',
          extracted: { statement: answer, topic: 'Ziel & Vorgehen', confidence: 0.81, plausibility: assessPlausibility(answer, contradiction) },
          resolveMissing: ['pm1'],
          topicDone: 'p1',
          contradiction: { text: contradiction, severity: 'hoch' },
        },
        `ek-${e.id}`,
      )
      const ek = interview.extracted[0]
      const review = buildReview(interview, ek, e)
      reviews.push(review)
      interview = { ...interview, extracted: [{ ...ek, reviewId: review.id }] }
    }
    interviews.push(interview)
    return { ...e, interviewId: interview.id }
  })
  return { employees: updated, interviews, reviews }
}

function createInitialState(): AppState {
  const workforce = seedEmployeeInterviews(structuredClone(SEED_EMPLOYEES))
  return structuredClone({
    version: STATE_VERSION,
    documents: SEED_DOCUMENTS,
    articles: SEED_ARTICLES,
    interviews: [...workforce.interviews, ...SEED_INTERVIEWS],
    modules: SEED_MODULES,
    contents: SEED_CONTENTS,
    progress: SEED_PROGRESS,
    activities: SEED_ACTIVITIES,
    conversations: SEED_CONVERSATIONS,
    notificationsReadAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    sidebarCollapsed: false,
    employees: workforce.employees,
    currentUserId: USERS[0].id,
    reviews: workforce.reviews,
  })
}

function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed?.version === STATE_VERSION) {
        // Unterbrochene Verarbeitungen (z. B. durch Reload) sauber kennzeichnen
        return {
          ...parsed,
          contents: [...(parsed.contents ?? []), ...SEED_CONTENTS.filter((s) => !(parsed.contents ?? []).some((c) => c.id === s.id))],
          documents: parsed.documents.map((d) =>
            d.status === 'uploading' || d.status === 'processing'
              ? { ...d, status: 'error', error: 'Die Verarbeitung wurde unterbrochen. Bitte erneut analysieren.' }
              : d,
          ),
        }
      }
    }
  } catch {
    /* defekter oder nicht verfügbarer Speicher → Ausgangszustand */
  }
  return createInitialState()
}

interface AppContextValue {
  state: AppState
  user: User
  can: (permission: Permission) => boolean
  setCurrentUser: (id: string) => void
  moveEmployee: (id: string, status: EmployeeStatus) => void
  planInterview: (id: string, trigger: InterviewTrigger, date?: string) => void
  startEmployeeInterview: (employeeId: string) => string | null
  submitInterviewReply: (interviewId: string, reply: InterviewReply) => void
  decideReview: (reviewId: string, decision: Exclude<ReviewStatus, 'offen'>, options?: { comment?: string; correctedStatement?: string }) => void
  logActivity: (activity: NewActivity) => void
  addDocument: (doc: Document) => void
  updateDocument: (id: string, patch: Partial<Document>) => void
  importDocument: (id: string) => string | null
  createInterview: (options?: { employeeId?: string; documentId?: string; scriptId?: InterviewScriptId }) => string
  updateInterview: (id: string, updater: (interview: ExpertInterview) => ExpertInterview) => void
  saveInterviewKnowledge: (id: string) => string | null
  completeInterview: (id: string) => string | null
  verifyArticle: (id: string) => void
  saveContent: (content: GeneratedContent) => void
  saveContentAsModule: (contentId: string) => string | null
  recordQuizResult: (moduleId: string, chapterId: string, score: number) => void
  upsertConversation: (conversation: Conversation) => void
  deleteConversation: (id: string) => void
  markNotificationsRead: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* Speicher voll oder blockiert – Demo funktioniert weiter im Arbeitsspeicher */
    }
  }, [state])

  // Backend-Lernmodule und -Artikel (nach KI-Interviews generiert) einmalig laden und einmischen:
  // Remote zuerst, dann vorhandene Einträge ohne Remote-Duplikat (Remote gewinnt).
  useEffect(() => {
    let cancelled = false
    Promise.all([fetchRemoteModules(), fetchRemoteArticles()]).then(([remoteModules, remoteArticles]) => {
      if (cancelled || (remoteModules.length === 0 && remoteArticles.length === 0)) return
      const moduleIds = new Set(remoteModules.map((m) => m.id))
      const articleIds = new Set(remoteArticles.map((a) => a.id))
      setState((s) => ({
        ...s,
        modules: remoteModules.length ? [...remoteModules, ...s.modules.filter((m) => !moduleIds.has(m.id))] : s.modules,
        articles: remoteArticles.length ? [...remoteArticles, ...s.articles.filter((a) => !articleIds.has(a.id))] : s.articles,
      }))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const logActivity = useCallback((activity: NewActivity) => {
    setState((s) => ({
      ...s,
      activities: [
        { actor: USERS.find((u) => u.id === s.currentUserId)?.name ?? USERS[0].name, ...activity, id: uid('act'), timestamp: nowISO() },
        ...s.activities,
      ].slice(0, 60),
    }))
  }, [])

  const addDocument = useCallback((doc: Document) => {
    setState((s) => ({ ...s, documents: [doc, ...s.documents] }))
  }, [])

  const updateDocument = useCallback((id: string, patch: Partial<Document>) => {
    setState((s) => ({ ...s, documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
  }, [])

  const importDocument = useCallback(
    (id: string) => {
      const doc = stateRef.current.documents.find((d) => d.id === id)
      if (!doc?.analysis) return null
      if (doc.linkedArticleIds.length) return doc.linkedArticleIds[0]
      const article = buildArticleFromDocument(doc)
      setState((s) => ({
        ...s,
        articles: [article, ...s.articles],
        documents: s.documents.map((d) => (d.id === id ? { ...d, status: 'imported', linkedArticleIds: [article.id] } : d)),
      }))
      logActivity({ type: 'article', title: 'Wissen in Knowledge Base übernommen', description: `${article.title} · aus ${doc.name}`, link: `/knowledge-base/${article.id}` })
      return article.id
    },
    [logActivity],
  )

  const createInterview = useCallback(
    (options?: { employeeId?: string; documentId?: string; scriptId?: InterviewScriptId }) => {
      const st = stateRef.current
      const employee = st.employees.find((e) => e.id === (options?.employeeId ?? 'e-becker')) ?? st.employees[0]
      const doc = options?.documentId ? st.documents.find((d) => d.id === options.documentId) : undefined
      const existing = !doc && !options?.scriptId ? st.interviews.find((i) => i.id === employee.interviewId && i.status === 'aktiv') : undefined
      if (existing) return existing.id
      const scriptId: InterviewScriptId =
        options?.scriptId ?? (doc?.analysis?.category === 'Tarife' || (doc && employee.id === 'e-becker') ? 'historisch' : doc ? 'generisch' : 'projekt')
      const interview = createInterviewRecord(employeeToExpert(employee), scriptId, doc, {
        employeeId: employee.id,
        projectName: scriptId === 'projekt' ? employee.projects[0]?.name : undefined,
      })
      setState((s) => ({
        ...s,
        interviews: [interview, ...s.interviews],
        employees: s.employees.map((e) =>
          e.id === employee.id ? { ...e, interviewId: interview.id, status: e.status === 'ausgeschieden' ? e.status : 'interview' } : e,
        ),
      }))
      logActivity({ type: 'interview', title: 'KI-Interview gestartet', description: `${employee.name} · ${interview.title}`, link: '/expert-knowledge' })
      return interview.id
    },
    [logActivity],
  )

  const startEmployeeInterview = useCallback((employeeId: string) => createInterview({ employeeId }), [createInterview])

  const moveEmployee = useCallback(
    (id: string, status: EmployeeStatus) => {
      const employee = stateRef.current.employees.find((e) => e.id === id)
      if (!employee || employee.status === status) return
      setState((s) => ({ ...s, employees: s.employees.map((e) => (e.id === id ? { ...e, status } : e)) }))
      logActivity({
        type: 'interview',
        title: 'Status geändert',
        description: `${employee.name}: ${EMPLOYEE_STATUS_META[employee.status].label} → ${EMPLOYEE_STATUS_META[status].label}`,
        link: '/workforce',
      })
    },
    [logActivity],
  )

  const planInterview = useCallback(
    (id: string, trigger: InterviewTrigger, date?: string) => {
      const employee = stateRef.current.employees.find((e) => e.id === id)
      if (!employee) return
      setState((s) => ({
        ...s,
        employees: s.employees.map((e) =>
          e.id === id ? { ...e, status: 'austritt_geplant', trigger, exitDate: date || (trigger === 'projektende' || trigger === 'schluesselwissen' ? undefined : e.exitDate) } : e,
        ),
      }))
      logActivity({
        type: 'interview',
        title: 'Interview geplant',
        description: `${employee.name}: ${TRIGGER_META[trigger].label} → ${TRIGGER_META[trigger].agent}`,
        link: '/workforce',
      })
    },
    [logActivity],
  )

  const updateInterview = useCallback((id: string, updater: (i: ExpertInterview) => ExpertInterview) => {
    setState((s) => ({ ...s, interviews: s.interviews.map((i) => (i.id === id ? updater(i) : i)) }))
  }, [])

  const saveInterviewKnowledge = useCallback(
    (id: string) => {
      const interview = stateRef.current.interviews.find((i) => i.id === id)
      if (!interview || !interview.extracted.length) return null
      const existing = stateRef.current.articles.find((a) => a.id === interview.savedArticleIds[0])
      const employee = stateRef.current.employees.find((e) => e.id === interview.employeeId)
      const roles = employee ? [employee.successorRole ?? employee.jobRole] : undefined
      const article = buildArticleFromInterview(interview, existing, roles)
      setState((s) => ({
        ...s,
        articles: existing ? s.articles.map((a) => (a.id === article.id ? article : a)) : [article, ...s.articles],
        interviews: s.interviews.map((i) => (i.id === id ? { ...i, savedArticleIds: [article.id], savedAt: nowISO() } : i)),
      }))
      logActivity({
        type: 'article',
        title: existing ? 'Wissensartikel aktualisiert' : 'Expertenwissen gespeichert',
        description: `${article.title} · ${interview.extracted.length} Aussagen von ${interview.expert.name}`,
        link: `/knowledge-base/${article.id}`,
      })
      return article.id
    },
    [logActivity],
  )

  const completeInterview = useCallback(
    (id: string) => {
      const interview = stateRef.current.interviews.find((i) => i.id === id)
      if (!interview) return null
      const articleId = interview.extracted.length ? saveInterviewKnowledge(id) : null
      setState((s) => ({
        ...s,
        interviews: s.interviews.map((i) => (i.id === id ? { ...i, status: 'abgeschlossen', updatedAt: nowISO(), pendingQuestion: null } : i)),
        employees: s.employees.map((e) =>
          e.id === interview.employeeId && articleId
            ? { ...e, status: e.status === 'ausgeschieden' ? e.status : 'wissen_gesichert', knowledgeCoverage: Math.max(e.knowledgeCoverage, 90) }
            : e,
        ),
      }))
      logActivity({ type: 'interview', title: 'Experteninterview abgeschlossen', description: `${interview.expert.name} · ${interview.title}`, link: '/expert-knowledge' })
      return articleId
    },
    [logActivity, saveInterviewKnowledge],
  )

  const verifyArticle = useCallback(
    (id: string) => {
      const article = stateRef.current.articles.find((a) => a.id === id)
      if (!article) return
      const date = todayDate()
      setState((s) => ({
        ...s,
        articles: s.articles.map((a) =>
          a.id === id
            ? {
                ...a,
                status: a.status === 'pruefung' ? 'aktuell' : a.status,
                verification: 'verifiziert',
                updatedAt: date,
                versions: [{ version: bumpVersion(a.versions[0]?.version ?? '1.0'), date, author: USERS.find((u) => u.id === stateRef.current.currentUserId)?.name ?? USERS[0].name, change: 'Fachlich geprüft und freigegeben' }, ...a.versions],
              }
            : a,
        ),
      }))
      logActivity({ type: 'article', title: 'Wissensartikel verifiziert', description: article.title, link: `/knowledge-base/${id}` })
    },
    [logActivity],
  )

  const submitInterviewReply = useCallback(
    (interviewId: string, reply: InterviewReply) => {
      const interview = stateRef.current.interviews.find((i) => i.id === interviewId)
      if (!interview) return
      const ekId = uid('ek')
      const updated = applyInterviewReply(interview, reply, ekId)
      const ek = updated.extracted.find((e) => e.id === ekId)
      const flagged = ek && ek.status === 'pruefung'
      const employee = stateRef.current.employees.find((e) => e.id === interview.employeeId)
      const review = flagged && ek ? buildReview(updated, ek, employee) : null
      const final = review ? { ...updated, extracted: updated.extracted.map((e) => (e.id === ekId ? { ...e, reviewId: review.id } : e)) } : updated
      setState((s) => ({
        ...s,
        interviews: s.interviews.map((i) => (i.id === interviewId ? final : i)),
        reviews: review ? [review, ...s.reviews] : s.reviews,
      }))
      if (review) {
        logActivity({
          type: 'interview',
          title: 'Vier-Augen-Prüfung angefordert',
          description: `Aussage von ${review.employeeName} · Plausibilität ${review.plausibility.score} % · an ${review.reviewerName}`,
          link: '/reviews',
          actor: 'KI-Plausibilitätsprüfung',
        })
      }
    },
    [logActivity],
  )

  const decideReview = useCallback(
    (reviewId: string, decision: Exclude<ReviewStatus, 'offen'>, options?: { comment?: string; correctedStatement?: string }) => {
      const st = stateRef.current
      const review = st.reviews.find((r) => r.id === reviewId)
      if (!review) return
      const reviewer = USERS.find((u) => u.id === st.currentUserId)?.name ?? USERS[0].name
      const interview = st.interviews.find((i) => i.id === review.interviewId)
      const updatedInterview = interview
        ? {
            ...interview,
            extracted: interview.extracted.map((e) =>
              e.id === review.extractedId
                ? {
                    ...e,
                    status: decision === 'abgelehnt' ? ('abgelehnt' as const) : ('validiert' as const),
                    statement: decision === 'korrigiert' && options?.correctedStatement ? options.correctedStatement : e.statement,
                  }
                : e,
            ),
          }
        : undefined
      const existing = updatedInterview ? st.articles.find((a) => a.id === updatedInterview.savedArticleIds[0]) : undefined
      const employee = st.employees.find((e) => e.id === review.employeeId)
      const article = updatedInterview && existing ? buildArticleFromInterview(updatedInterview, existing, employee ? [employee.successorRole ?? employee.jobRole] : undefined) : undefined
      setState((s) => ({
        ...s,
        reviews: s.reviews.map((r) =>
          r.id === reviewId
            ? { ...r, status: decision, decidedAt: nowISO(), decidedBy: reviewer, comment: options?.comment, correctedStatement: options?.correctedStatement }
            : r,
        ),
        interviews: updatedInterview ? s.interviews.map((i) => (i.id === updatedInterview.id ? updatedInterview : i)) : s.interviews,
        articles: article ? s.articles.map((a) => (a.id === article.id ? article : a)) : s.articles,
      }))
      const label = decision === 'bestaetigt' ? 'bestätigt' : decision === 'korrigiert' ? 'korrigiert' : 'abgelehnt'
      logActivity({ type: 'article', title: `Aussage ${label}`, description: `${review.employeeName} · ${review.topic} · geprüft von ${reviewer}`, link: '/reviews' })
    },
    [logActivity],
  )

  const saveContent = useCallback((content: GeneratedContent) => {
    const tagged: GeneratedContent = { ...content, tags: Array.from(new Set([...(content.tags ?? []), 'neu'])) }
    setState((s) => ({ ...s, contents: [tagged, ...s.contents].slice(0, 20) }))
  }, [])

  const saveContentAsModule = useCallback(
    (contentId: string) => {
      const content = stateRef.current.contents.find((c) => c.id === contentId)
      if (!content) return null
      if (content.savedModuleId) return content.savedModuleId
      const sources = stateRef.current.articles.filter((a) => content.sourceArticleIds.includes(a.id))
      const module = buildModuleFromContent(content, sources[0]?.category ?? 'Prozesse', Array.from(new Set(sources.map((a) => a.expert))))
      const ownerIds = new Set(
        stateRef.current.interviews.filter((i) => i.savedArticleIds.some((id) => content.sourceArticleIds.includes(id))).map((i) => i.employeeId),
      )
      setState((s) => ({
        ...s,
        modules: [module, ...s.modules],
        employees: s.employees.map((e) => (ownerIds.has(e.id) ? { ...e, moduleIds: [...e.moduleIds, module.id] } : e)),
        contents: s.contents.map((c) => (c.id === contentId ? { ...c, savedModuleId: module.id } : c)),
      }))
      logActivity({
        type: 'module',
        title: 'Lernmodul generiert',
        description: `${module.title} · ${module.chapters.length} Kapitel, ${content.quiz.length} Quizfragen`,
        link: `/learning/${module.id}`,
      })
      return module.id
    },
    [logActivity],
  )

  const recordQuizResult = useCallback(
    (moduleId: string, chapterId: string, score: number) => {
      const module = stateRef.current.modules.find((m) => m.id === moduleId)
      const chapter = module?.chapters.find((c) => c.id === chapterId)
      const passed = score >= PASSING_SCORE
      setState((s) => {
        const prev = s.progress[moduleId]?.[chapterId]
        return {
          ...s,
          progress: {
            ...s.progress,
            [moduleId]: {
              ...(s.progress[moduleId] ?? {}),
              [chapterId]: {
                completed: (prev?.completed ?? false) || passed,
                bestScore: Math.max(prev?.bestScore ?? 0, score),
                attempts: (prev?.attempts ?? 0) + 1,
                lastAttempt: nowISO(),
              },
            },
          },
        }
      })
      logActivity({
        type: 'quiz',
        title: passed ? 'Quiz bestanden' : 'Quiz nicht bestanden',
        description: `${module?.title ?? 'Lernmodul'} · ${chapter?.title ?? 'Kapitel'} mit ${score} %`,
        link: `/learning/${moduleId}`,
      })
    },
    [logActivity],
  )

  const upsertConversation = useCallback((conversation: Conversation) => {
    setState((s) => {
      const exists = s.conversations.some((c) => c.id === conversation.id)
      return {
        ...s,
        conversations: exists
          ? s.conversations.map((c) => (c.id === conversation.id ? conversation : c))
          : [conversation, ...s.conversations],
      }
    })
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setState((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== id) }))
  }, [])

  const markNotificationsRead = useCallback(() => setState((s) => ({ ...s, notificationsReadAt: nowISO() })), [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => setState((s) => ({ ...s, sidebarCollapsed: collapsed })), [])

  const resetDemo = useCallback(() => {
    setState((s) => ({ ...createInitialState(), currentUserId: s.currentUserId }))
  }, [])

  const setCurrentUser = useCallback((id: string) => setState((s) => ({ ...s, currentUserId: id })), [])

  const user = USERS.find((u) => u.id === state.currentUserId) ?? USERS[0]
  const can = useCallback((permission: Permission) => canUser(user, permission), [user])

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      user,
      can,
      setCurrentUser,
      moveEmployee,
      planInterview,
      startEmployeeInterview,
      submitInterviewReply,
      decideReview,
      logActivity,
      addDocument,
      updateDocument,
      importDocument,
      createInterview,
      updateInterview,
      saveInterviewKnowledge,
      completeInterview,
      verifyArticle,
      saveContent,
      saveContentAsModule,
      recordQuizResult,
      upsertConversation,
      deleteConversation,
      markNotificationsRead,
      setSidebarCollapsed,
      resetDemo,
    }),
    [
      state,
      user,
      can,
      setCurrentUser,
      moveEmployee,
      planInterview,
      startEmployeeInterview,
      submitInterviewReply,
      decideReview,
      logActivity,
      addDocument,
      updateDocument,
      importDocument,
      createInterview,
      updateInterview,
      saveInterviewKnowledge,
      completeInterview,
      verifyArticle,
      saveContent,
      saveContentAsModule,
      recordQuizResult,
      upsertConversation,
      deleteConversation,
      markNotificationsRead,
      setSidebarCollapsed,
      resetDemo,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp muss innerhalb von <AppProvider> verwendet werden')
  return ctx
}
