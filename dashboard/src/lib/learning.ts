import type { LearningModule, LearningProgress } from '@/types'

export const PASSING_SCORE = 80

export type ChapterState = 'completed' | 'available' | 'locked'

export function getChapterState(module: LearningModule, progress: LearningProgress, index: number): ChapterState {
  const chapter = module.chapters[index]
  const mp = progress[module.id] ?? {}
  if (mp[chapter.id]?.completed) return 'completed'
  if (index === 0) return 'available'
  const prev = module.chapters[index - 1]
  return mp[prev.id]?.completed ? 'available' : 'locked'
}

export function getModuleProgress(module: LearningModule, progress: LearningProgress) {
  const mp = progress[module.id] ?? {}
  const completed = module.chapters.filter((c) => mp[c.id]?.completed).length
  const total = module.chapters.length
  const started = module.chapters.some((c) => (mp[c.id]?.attempts ?? 0) > 0)
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
    status: completed === total && total > 0 ? ('abgeschlossen' as const) : started ? ('in_bearbeitung' as const) : ('offen' as const),
  }
}

export function getOverallLearningStats(modules: LearningModule[], progress: LearningProgress) {
  let totalChapters = 0
  let completedChapters = 0
  const scores: number[] = []
  let minutes = 0
  let completedModules = 0
  let inProgress = 0
  let notStarted = 0
  for (const m of modules) {
    const p = getModuleProgress(m, progress)
    totalChapters += p.total
    completedChapters += p.completed
    if (p.status === 'abgeschlossen') completedModules += 1
    else if (p.status === 'in_bearbeitung') inProgress += 1
    else notStarted += 1
    for (const c of m.chapters) {
      const cp = progress[m.id]?.[c.id]
      if (cp && cp.attempts > 0) scores.push(cp.bestScore)
      if (cp?.completed) minutes += c.durationMin
    }
  }
  return {
    totalChapters,
    completedChapters,
    completionRate: totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    minutes,
    completedModules,
    inProgress,
    notStarted,
  }
}
