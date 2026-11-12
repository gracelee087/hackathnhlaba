import { useMemo } from 'react'
import { useApp, type AppState } from '@/context/AppContext'
import { BASELINE, GROWTH_HISTORY, employeeToExpert } from '@/data/mock-data'
import { getOverallLearningStats } from '@/lib/learning'

export interface JourneyStep {
  id: string
  label: string
  done: boolean
  path: string
}

function computeJourney(state: AppState): JourneyStep[] {
  const demoDocs = state.documents.filter((d) => !d.seed)
  const demoInterviews = state.interviews.filter((i) => !i.seed)
  const demoModules = state.modules.filter((m) => !m.seed)
  return [
    { id: 'upload', label: 'Dokument hochladen & analysieren', done: demoDocs.some((d) => d.analysis), path: '/documents' },
    { id: 'import', label: 'Wissen in Knowledge Base übernehmen', done: demoDocs.some((d) => d.status === 'imported'), path: '/documents' },
    { id: 'interview', label: 'Experteninterview mit Rückfragen führen', done: demoInterviews.some((i) => i.messages.filter((m) => m.role === 'expert').length >= 2), path: '/expert-knowledge' },
    { id: 'save', label: 'Wissen validieren & speichern', done: demoInterviews.some((i) => i.savedArticleIds.length > 0), path: '/expert-knowledge' },
    { id: 'module', label: 'Lernmodul mit KI generieren', done: demoModules.length > 0, path: '/content-studio' },
    {
      id: 'quiz',
      label: 'Quiz in der Learning Academy bestehen',
      done: demoModules.some((m) => Object.values(state.progress[m.id] ?? {}).some((p) => p.completed)),
      path: demoModules[0] ? `/learning/${demoModules[0].id}` : '/learning',
    },
  ]
}

/** Abgeleitete Kennzahlen – reagieren live auf jede Änderung im App-State. */
export function useMetrics() {
  const { state } = useApp()
  return useMemo(() => {
    const newArticles = state.articles.filter((a) => !a.seed).length
    const newDocs = state.documents.filter((d) => !d.seed && (d.status === 'analyzed' || d.status === 'imported')).length
    const demoInterviews = state.interviews.filter((i) => !i.seed)
    const secured = demoInterviews.filter((i) => i.savedArticleIds.length > 0)
    const completedInterviews = demoInterviews.filter((i) => i.status === 'abgeschlossen').length
    const newModules = state.modules.filter((m) => !m.seed).length
    const learning = getOverallLearningStats(state.modules, state.progress)
    const atRisk = state.employees
      .filter((e) => e.status === 'austritt_geplant' || e.status === 'interview')
      .map(employeeToExpert)
      .sort((a, b) => a.knowledgeCoverage - b.knowledgeCoverage)
    const workforce = {
      aktiv: state.employees.filter((e) => e.status === 'aktiv').length,
      austritt_geplant: state.employees.filter((e) => e.status === 'austritt_geplant').length,
      interview: state.employees.filter((e) => e.status === 'interview').length,
      wissen_gesichert: state.employees.filter((e) => e.status === 'wissen_gesichert').length,
      ausgeschieden: state.employees.filter((e) => e.status === 'ausgeschieden').length,
      newHires: state.employees.filter((e) => e.isNewHire && e.status === 'aktiv').length,
      lostKnowledge: state.employees.filter((e) => e.status === 'ausgeschieden' && e.moduleIds.length === 0).length,
    }
    const newGaps = state.documents
      .filter((d) => !d.seed && d.analysis)
      .reduce((sum, d) => sum + (d.analysis?.missingKnowledge.length ?? 0), 0)
    const resolvedGaps = demoInterviews.reduce((sum, i) => sum + i.missingInfo.filter((m) => m.resolved).length, 0)
    const articles = BASELINE.articles + newArticles
    const documentsAnalyzed = BASELINE.documents + newDocs
    const growth = GROWTH_HISTORY.map((p, idx, arr) =>
      idx === arr.length - 1
        ? { ...p, articles, documents: documentsAnalyzed, interviews: p.interviews + completedInterviews, completion: Math.max(p.completion, learning.completionRate) }
        : p,
    )
    const reviewNeeded = state.articles.filter((a) => a.status === 'pruefung').length
    const openContradictions =
      state.documents.reduce((s, d) => s + (d.analysis?.contradictions.length ?? 0), 0) +
      state.interviews.reduce((s, i) => s + i.contradictions.filter((c) => !c.resolved).length, 0)

    return {
      articles,
      newArticles,
      documentsAnalyzed,
      newDocs,
      expertCoverage: Math.min(99, BASELINE.expertCoverage + secured.length * 2),
      activeModules: BASELINE.modules + newModules,
      newModules,
      interviewsCompleted: BASELINE.interviews + completedInterviews,
      knowledgeGaps: Math.max(0, BASELINE.gaps + newGaps - resolvedGaps),
      atRisk,
      workforce,
      learning,
      growth,
      reviewNeeded,
      openContradictions,
      activeInterviews: state.interviews.filter((i) => i.status === 'aktiv').length,
      journey: computeJourney(state),
    }
  }, [state])
}
