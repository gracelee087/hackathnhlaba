import type { Chapter, GeneratedContent, LearningModule, Slide, VideoScene } from '@/types'
import { truncate, uid } from '@/lib/utils'

export const FORMAT_LABELS: Record<GeneratedContent['format'], string> = {
  praesentation: 'Präsentation',
  video: 'Lernvideo',
  podcast: 'Podcast',
  quiz: 'Quiz',
}

export function slidesToScenes(slides: Slide[]): VideoScene[] {
  return slides.map((slide, i) => ({
    title: slide.title,
    narration: slide.notes,
    subtitle: truncate(slide.notes || slide.bullets[0] || slide.title, 140),
    durationSec: 18 + ((slide.bullets.length * 7 + i * 3) % 20),
  }))
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Wandelt generierte Inhalte in ein Lernmodul für die Learning Academy um. */
export function buildModuleFromContent(content: GeneratedContent, category: LearningModule['category'], sourceExperts: string[] = []): LearningModule {
  const half = Math.max(2, Math.ceil(content.quiz.length / 2))
  const firstQuiz = content.quiz.slice(0, half)
  const secondQuiz = content.quiz.slice(half).length >= 2 ? content.quiz.slice(half) : content.quiz.slice(-2)
  const typeMap: Record<GeneratedContent['format'], Chapter['type']> = {
    praesentation: 'praesentation',
    video: 'video',
    podcast: 'podcast',
    quiz: 'lektion',
  }
  const coreSlides = content.slides.slice(0, Math.max(2, content.slides.length - 1))
  const summarySlides = content.slides.slice(-1)
  const totalSec = content.scenes.reduce((a, s) => a + s.durationSec, 0)
  const chapters: Chapter[] = [
    {
      id: uid('ch'),
      title: `${FORMAT_LABELS[content.format]}: Kerninhalte`,
      type: typeMap[content.format],
      durationMin: Math.max(8, Math.round(totalSec / 60) + 6),
      summary: content.learningGoals.join(' · '),
      slides: coreSlides,
      quiz: { id: uid('quiz'), title: `Wissenscheck: ${content.title}`, passingScore: 80, questions: firstQuiz },
    },
    {
      id: uid('ch'),
      title: 'Transfer & Abschlusstest',
      type: 'lektion',
      durationMin: 10,
      summary: 'Zusammenfassung und Abschlusstest zur Anwendung in der Praxis.',
      slides: summarySlides,
      quiz: { id: uid('quiz'), title: 'Abschlusstest', passingScore: 80, questions: secondQuiz },
    },
  ]
  return {
    id: uid('mod'),
    title: content.title,
    description: `KI-generiertes Lernmodul (${FORMAT_LABELS[content.format]}) für ${content.audience} – erstellt aus ${content.sourceArticleIds.length} Wissensartikel(n).`,
    category,
    level: content.audience,
    difficulty: content.difficulty,
    durationMin: chapters.reduce((a, c) => a + c.durationMin, 0),
    chapters,
    sourceArticleIds: content.sourceArticleIds,
    createdAt: new Date().toISOString().slice(0, 10),
    generated: true,
    format: content.format,
    targetRoles: content.targetRoles ?? [],
    sourceExperts,
    tags: ['neu'],
  }
}
