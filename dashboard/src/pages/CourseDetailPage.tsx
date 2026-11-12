import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck, Clock, FileText, ListChecks, Lock, CirclePlay, Presentation, SearchX, Sparkles } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/misc'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { SlideViewer, VideoPlayer } from '@/components/learning/MediaViewers'
import { QuizRunner } from '@/components/learning/QuizRunner'
import { LEVEL_VARIANT } from '@/components/learning/CourseCard'
import { useApp } from '@/context/AppContext'
import { PASSING_SCORE, getChapterState, getModuleProgress } from '@/lib/learning'
import { slidesToScenes } from '@/lib/content'
import { cn } from '@/lib/utils'

const TYPE_LABEL = { video: 'Video', praesentation: 'Präsentation', lektion: 'Lektion', podcast: 'Podcast' } as const

export default function CourseDetailPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, recordQuizResult } = useApp()
  const module = state.modules.find((m) => m.id === moduleId)

  const firstOpen = useMemo(() => {
    if (!module) return 0
    const idx = module.chapters.findIndex((_, i) => getChapterState(module, state.progress, i) === 'available')
    return idx === -1 ? 0 : idx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id])

  const [chapterIndex, setChapterIndex] = useState(firstOpen)
  const [tab, setTab] = useState('video')

  useEffect(() => {
    setChapterIndex(firstOpen)
  }, [firstOpen])

  const scenes = useMemo(
    () => (module ? slidesToScenes((module.chapters[chapterIndex] ?? module.chapters[0]).slides) : []),
    [module, chapterIndex],
  )

  if (!module) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="Kurs nicht gefunden"
          action={<Button variant="outline" onClick={() => navigate('/learning')}><ArrowLeft /> Zur Learning Academy</Button>}
        />
      </Card>
    )
  }

  const chapter = module.chapters[chapterIndex] ?? module.chapters[0]
  const chState = getChapterState(module, state.progress, chapterIndex)
  const cp = state.progress[module.id]?.[chapter.id]
  const mp = getModuleProgress(module, state.progress)
  const hasNext = chapterIndex < module.chapters.length - 1

  const selectChapter = (i: number) => {
    if (getChapterState(module, state.progress, i) === 'locked') {
      toast({ title: 'Kapitel gesperrt', description: `Schließen Sie das vorherige Kapitel mit mindestens ${PASSING_SCORE} % ab.`, variant: 'warning' })
      return
    }
    setChapterIndex(i)
    setTab('video')
  }

  const onFinish = (score: number) => {
    recordQuizResult(module.id, chapter.id, score)
    if (score >= PASSING_SCORE) {
      toast({
        title: `Kapitel bestanden (${score} %)`,
        description: hasNext ? 'Das nächste Kapitel ist jetzt freigeschaltet.' : 'Kurs abgeschlossen – Lernfortschritt und Analytics wurden aktualisiert.',
        variant: 'success',
      })
    } else {
      toast({ title: `${score} % – nicht bestanden`, description: `Für die Freischaltung sind ${PASSING_SCORE} % erforderlich.`, variant: 'warning' })
    }
  }

  return (
    <div className="space-y-8">
      <Link to="/learning" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Zurück zur Learning Academy
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant={LEVEL_VARIANT[module.level]}>{module.level}</Badge>
            <Badge variant="outline">Schwierigkeit: {module.difficulty}</Badge>
            <Badge variant="outline"><Clock /> {module.durationMin} Min.</Badge>
            {module.generated && <Badge variant="brand"><Sparkles /> KI-generiert</Badge>}
            {module.tags?.includes('neu') && <Badge className="border-transparent bg-brand text-white">Neu</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{module.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{module.description}</p>
        </div>
        <div className="w-full max-w-xs">
          <div className="mb-1.5 flex justify-between text-[12px]">
            <span className="text-muted-foreground">Kursfortschritt</span>
            <span className="font-semibold tabular">{mp.completed}/{mp.total} Kapitel · {mp.percent} %</span>
          </div>
          <Progress value={mp.percent} className="h-2" indicatorClassName={mp.status === 'abgeschlossen' ? 'bg-success' : undefined} label="Kursfortschritt" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit">
          <SectionHeader title="Kapitel" description={`Freischaltung ab ${PASSING_SCORE} % im Quiz`} />
          <ol className="space-y-1 p-3">
            {module.chapters.map((c, i) => {
              const s = getChapterState(module, state.progress, i)
              const score = state.progress[module.id]?.[c.id]?.bestScore
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectChapter(i)}
                    aria-current={i === chapterIndex}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                      i === chapterIndex ? 'bg-navy-800 text-white' : 'hover:bg-slate-50',
                      s === 'locked' && i !== chapterIndex && 'opacity-60',
                    )}
                  >
                    <span className="mt-0.5">
                      {s === 'completed' ? (
                        <CircleCheck className={cn('size-4', i === chapterIndex ? 'text-brand-300' : 'text-success')} />
                      ) : s === 'locked' ? (
                        <Lock className="size-4 text-slate-400" />
                      ) : (
                        <CirclePlay className={cn('size-4', i === chapterIndex ? 'text-white' : 'text-brand')} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-snug">{i + 1}. {c.title}</span>
                      <span className={cn('mt-0.5 block text-[11.5px]', i === chapterIndex ? 'text-slate-300' : 'text-muted-foreground')}>
                        {TYPE_LABEL[c.type]} · {c.durationMin} Min.{score !== undefined ? ` · Best: ${score} %` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-brand">Kapitel {chapterIndex + 1} von {module.chapters.length}</p>
            <h2 className="mt-0.5 text-[17px] font-semibold">{chapter.title}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{chapter.summary}</p>
          </div>
          {chState === 'locked' ? (
            <EmptyState
              className="py-16"
              icon={Lock}
              title="Dieses Kapitel ist noch gesperrt"
              description={`Schließen Sie das vorherige Kapitel mit mindestens ${PASSING_SCORE} % im Quiz ab, um fortzufahren.`}
              action={<Button variant="outline" onClick={() => setChapterIndex(chapterIndex - 1)}>Zum vorherigen Kapitel</Button>}
            />
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
                <TabsList>
                  <TabsTrigger value="video" icon={CirclePlay}>Video</TabsTrigger>
                  <TabsTrigger value="slides" icon={Presentation}>Präsentation</TabsTrigger>
                  <TabsTrigger value="quiz" icon={ListChecks}>Quiz</TabsTrigger>
                </TabsList>
                {cp?.completed ? (
                  <Badge variant="success"><CircleCheck /> Bestanden · {cp.bestScore} %</Badge>
                ) : (
                  <Badge variant="outline"><FileText /> {chapter.quiz.questions.length} Quizfragen</Badge>
                )}
              </div>
              <div className="p-5">
                <TabsContent value="video">
                  {module.videoUrl ? (
                    <video
                      controls
                      preload="metadata"
                      src={module.videoUrl}
                      className="w-full rounded-2xl bg-black aspect-video"
                      // Ton beim Abspielen sicherstellen (falls der Browser das Element stumm gestartet hat)
                      onPlay={(e) => {
                        e.currentTarget.muted = false
                        if (e.currentTarget.volume === 0) e.currentTarget.volume = 1
                      }}
                    />
                  ) : (
                    <VideoPlayer scenes={scenes} />
                  )}
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setTab('quiz')}>Zum Quiz <ListChecks /></Button>
                  </div>
                </TabsContent>
                <TabsContent value="slides">
                  <SlideViewer slides={chapter.slides} />
                </TabsContent>
                <TabsContent value="quiz">
                  <QuizRunner
                    key={chapter.id}
                    questions={chapter.quiz.questions}
                    passingScore={chapter.quiz.passingScore}
                    onFinish={onFinish}
                    hasNext={hasNext}
                    onNext={() => {
                      setChapterIndex(chapterIndex + 1)
                      setTab('video')
                    }}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  )
}
