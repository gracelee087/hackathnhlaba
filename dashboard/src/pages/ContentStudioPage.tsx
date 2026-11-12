import type * as React from 'react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CircleCheck,
  Circle,
  GraduationCap,
  Headphones,
  ListChecks,
  LoaderCircle,
  Presentation,
  RefreshCw,
  Sparkles,
  Video,
  WandSparkles,
} from 'lucide-react'
import type { Audience, ContentFormat, Difficulty, GeneratedContent, JobRole } from '@/types'
import { PageHeader, DemoBadge, EmptyState, Skeleton } from '@/components/ui/misc'
import { Card, SectionHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/inputs'
import { Segmented } from '@/components/ui/segmented'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { PodcastPlayer, SceneList, SlideViewer, VideoPlayer } from '@/components/learning/MediaViewers'
import { QuizRunner } from '@/components/learning/QuizRunner'
import { useApp } from '@/context/AppContext'
import { GENERATION_STEPS, aiService } from '@/services/ai-service'
import { FORMAT_LABELS, formatDuration } from '@/lib/content'
import { JOB_ROLES } from '@/lib/permissions'
import { cn, formatRelative, sleep } from '@/lib/utils'

const TOOLS: { format: ContentFormat; title: string; description: string; icon: React.ElementType }[] = [
  { format: 'praesentation', title: 'Presentation Generator', description: 'Folienstruktur, Präsentationsvorschau und Sprechertexte', icon: Presentation },
  { format: 'video', title: 'Video Generator', description: 'Lernvideo mit Szenen, Sprechertext und Untertiteln', icon: Video },
  { format: 'podcast', title: 'Podcast Generator', description: 'Dialog zwischen Moderation und Fachexperte', icon: Headphones },
  { format: 'quiz', title: 'Quiz Generator', description: 'Interaktive Fragen aus Wissensartikeln', icon: ListChecks },
]

function StepLabel({ n, title, done }: { n: number; title: string; done: boolean }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className={cn('grid size-5 place-items-center rounded-full text-[10.5px] font-semibold', done ? 'bg-success text-white' : 'bg-navy-800 text-white')}>
        {done ? <Check className="size-3" /> : n}
      </span>
      <span className="text-[13px] font-semibold">{title}</span>
    </div>
  )
}

export default function ContentStudioPage() {
  const { state, saveContent, saveContentAsModule } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as { articleIds?: string[]; format?: ContentFormat; audience?: Audience } | null
  const preselected = navState?.articleIds

  const [selected, setSelected] = useState<string[]>(() => preselected?.filter((id) => state.articles.some((a) => a.id === id)) ?? [])
  const [format, setFormat] = useState<ContentFormat>(navState?.format ?? 'praesentation')
  const [audience, setAudience] = useState<Audience>(navState?.audience ?? 'Anfänger')
  const [manualRoles, setManualRoles] = useState<JobRole[] | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('Mittel')
  const [search, setSearch] = useState('')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [resultId, setResultId] = useState<string | null>(null)
  const [previewTab, setPreviewTab] = useState('main')

  const result: GeneratedContent | undefined = state.contents.find((c) => c.id === resultId)
  const articles = useMemo(
    () =>
      state.articles
        .filter((a) => a.status !== 'veraltet')
        .filter((a) => `${a.title} ${a.category}`.toLowerCase().includes(search.toLowerCase())),
    [state.articles, search],
  )

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const suggestedRoles = useMemo(
    () => Array.from(new Set(state.articles.filter((a) => selected.includes(a.id)).flatMap((a) => a.targetRoles ?? []))),
    [state.articles, selected],
  )
  const targetRoles = manualRoles ?? suggestedRoles
  const toggleRole = (role: JobRole) =>
    setManualRoles((current) => {
      const base = current ?? suggestedRoles
      return base.includes(role) ? base.filter((r) => r !== role) : [...base, role]
    })

  const generate = async () => {
    const chosen = state.articles.filter((a) => selected.includes(a.id))
    if (!chosen.length) {
      toast({ title: 'Keine Wissensquelle gewählt', description: 'Bitte wählen Sie in Schritt 1 mindestens einen Artikel.', variant: 'warning' })
      return
    }
    setRunning(true)
    setResultId(null)
    try {
      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        setStep(i)
        await sleep(650)
      }
      const content = await aiService.generateContent({ articles: chosen, library: state.articles, format, audience, difficulty, targetRoles })
      saveContent(content)
      setResultId(content.id)
      setPreviewTab('main')
      toast({ title: 'Inhalt generiert', description: `${FORMAT_LABELS[format]} „${content.title}“`, variant: 'success' })
    } catch (e) {
      toast({ title: 'Generierung fehlgeschlagen', description: e instanceof Error ? e.message : 'Unbekannter Fehler', variant: 'error' })
    } finally {
      setRunning(false)
    }
  }

  const saveToAcademy = () => {
    if (!result) return
    const moduleId = saveContentAsModule(result.id)
    if (!moduleId) return
    toast({
      title: 'In Learning Academy gespeichert',
      description: result.targetRoles.length
        ? `Erscheint im Onboarding-Dashboard für: ${result.targetRoles.join(', ')}`
        : 'Das Lernmodul ist jetzt für Mitarbeitende verfügbar.',
      variant: 'success',
      action: { label: 'Kurs öffnen', onClick: () => navigate(`/learning/${moduleId}`) },
    })
  }

  const totalVideo = result?.scenes.reduce((a, s) => a + s.durationSec, 0) ?? 0

  return (
    <div className="space-y-8">
      <PageHeader title="AI Content Studio" description="Aus Expertenwissen werden intelligente Lernformate." actions={<DemoBadge />} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Ausgabeformat">
        {TOOLS.map((t) => {
          const Icon = t.icon
          const active = format === t.format
          return (
            <button
              key={t.format}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setFormat(t.format)}
              className={cn(
                'flex items-start gap-3 rounded-lg border bg-white p-4 text-left shadow-card transition-all hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                active ? 'border-navy-800 ring-1 ring-navy-800' : 'border-border',
              )}
            >
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-md transition-colors', active ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy-800')}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold">{t.title}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">{t.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="h-fit">
          <SectionHeader title="Generierung konfigurieren" description="In sechs Schritten zum Lernformat" />
          <div className="space-y-5 p-5 pt-4">
            <div>
              <StepLabel n={1} title="Wissensquelle auswählen" done={selected.length > 0} />
              <SearchInput placeholder="Artikel filtern…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Wissensartikel filtern" />
              <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1 scrollbar-thin">
                {articles.map((a) => {
                  const checked = selected.includes(a.id)
                  return (
                    <li key={a.id}>
                      <label className={cn('flex cursor-pointer items-start gap-2.5 rounded px-2 py-1.5 transition-colors', checked ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(a.id)} className="mt-0.5 size-3.5 accent-[#12345A]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium">{a.title}</span>
                          <span className="text-[11px] text-muted-foreground">{a.category}</span>
                        </span>
                        {a.tags?.includes('neu') && <Badge className="scale-90 border-transparent bg-brand text-white">Neu</Badge>}
                        <StatusBadge status={a.status} className="scale-90" />
                      </label>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">{selected.length} ausgewählt · veraltete Regelungen sind ausgeschlossen</p>
            </div>

            <div>
              <StepLabel n={2} title="Ausgabeformat" done />
              <Segmented
                className="w-full"
                ariaLabel="Ausgabeformat"
                value={format}
                onChange={setFormat}
                options={TOOLS.map((t) => ({ value: t.format, label: FORMAT_LABELS[t.format] }))}
              />
            </div>

            <div>
              <StepLabel n={3} title="Zielgruppe" done />
              <Segmented
                className="w-full"
                ariaLabel="Zielgruppe"
                value={audience}
                onChange={setAudience}
                options={[
                  { value: 'Anfänger', label: 'Anfänger' },
                  { value: 'Fortgeschrittene', label: 'Fortgeschrittene' },
                  { value: 'Experten', label: 'Experten' },
                ]}
              />
            </div>

            <div>
              <StepLabel n={4} title="Schwierigkeitsgrad" done />
              <Segmented
                className="w-full"
                ariaLabel="Schwierigkeitsgrad"
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { value: 'Leicht', label: 'Leicht' },
                  { value: 'Mittel', label: 'Mittel' },
                  { value: 'Schwer', label: 'Schwer' },
                ]}
              />
            </div>

            <div>
              <StepLabel n={5} title="Zielrollen für die Einarbeitung" done={targetRoles.length > 0} />
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zielrollen">
                {JOB_ROLES.filter((r) => r !== 'Personal (HR)' && r !== 'Knowledge Management').map((role) => {
                  const on = targetRoles.includes(role)
                  return (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleRole(role)}
                      className={cn(
                        'rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors',
                        on ? 'border-navy-800 bg-navy-800 text-white' : 'border-border bg-white text-slate-600 hover:border-slate-300',
                      )}
                    >
                      {role}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                Neue Mitarbeitende dieser Rollen sehen das Modul automatisch in ihrem Onboarding-Dashboard.
              </p>
            </div>

            <div>
              <StepLabel n={6} title="Generieren" done={!!result} />
              <Button className="w-full" size="lg" onClick={generate} disabled={running}>
                {running ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                {running ? 'Wird generiert …' : 'Mit KI generieren'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          {running ? (
            <div className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-md bg-navy-800 text-white">
                  <Sparkles className="size-5 animate-pulse" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold">KI erstellt {FORMAT_LABELS[format]}</p>
                  <p className="text-[12.5px] text-muted-foreground">{audience} · {difficulty} · {selected.length} Quelle(n)</p>
                </div>
              </div>
              <Progress value={((step + 1) / GENERATION_STEPS.length) * 100} className="mt-5 h-2" label="Generierungsfortschritt" />
              <ol className="mt-5 space-y-1">
                {GENERATION_STEPS.map((s, i) => (
                  <li key={s} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-[13px]', i === step && 'bg-brand-50')}>
                    {i < step ? <CircleCheck className="size-4 text-success" /> : i === step ? <LoaderCircle className="size-4 animate-spin text-brand" /> : <Circle className="size-4 text-slate-300" />}
                    <span className={i === step ? 'font-semibold' : 'text-muted-foreground'}>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-video" />)}
              </div>
            </div>
          ) : result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wide text-brand">
                    <span>{FORMAT_LABELS[result.format]} · generiert {formatRelative(result.createdAt)}</span>
                    {result.tags?.includes('neu') && <Badge className="border-transparent bg-brand normal-case tracking-normal text-white">Neu</Badge>}
                  </p>
                  <h2 className="mt-0.5 truncate text-[17px] font-semibold">{result.title}</h2>
                  <p className="text-[12.5px] text-muted-foreground">
                    {result.targetRoles.length > 0 && <>Für: {result.targetRoles.join(', ')} · </>}
                    {result.audience} · {result.difficulty} · {result.slides.length} Folien · {result.quiz.length} Quizfragen
                    {result.format === 'video' && ` · ${formatDuration(totalVideo)} Min.`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generate}>
                    <RefreshCw /> Neu generieren
                  </Button>
                  {result.savedModuleId ? (
                    <Button size="sm" variant="brand" onClick={() => navigate(`/learning/${result.savedModuleId}`)}>
                      In Learning Academy öffnen <ArrowRight />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={saveToAcademy}>
                      <GraduationCap /> In Learning Academy speichern
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-b border-border bg-slate-50/50 px-5 py-3">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Lernziele</p>
                <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                  {result.learningGoals.map((g) => (
                    <li key={g} className="flex items-start gap-2 text-[12.5px]"><CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success" /> {g}</li>
                  ))}
                </ul>
              </div>

              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <div className="px-5 pt-4">
                  <TabsList>
                    <TabsTrigger value="main">Vorschau</TabsTrigger>
                    {result.format === 'video' && <TabsTrigger value="script">Sprechertext & Untertitel</TabsTrigger>}
                    {result.format !== 'quiz' && <TabsTrigger value="quiz">Quizfragen</TabsTrigger>}
                    {result.format === 'praesentation' && <TabsTrigger value="outline">Folienstruktur</TabsTrigger>}
                  </TabsList>
                </div>
                <div className="p-5">
                  <TabsContent value="main">
                    {result.format === 'praesentation' && <SlideViewer slides={result.slides} />}
                    {result.format === 'video' && <VideoPlayer scenes={result.scenes} />}
                    {result.format === 'podcast' && <PodcastPlayer lines={result.podcast} title={result.title} />}
                    {result.format === 'quiz' && <QuizRunner questions={result.quiz} />}
                  </TabsContent>
                  <TabsContent value="script">
                    <SceneList scenes={result.scenes} />
                    <div className="mt-4 rounded-md border border-border bg-slate-950 p-4 font-mono text-[11.5px] leading-relaxed text-slate-200">
                      {result.scenes.map((s, i) => (
                        <p key={i} className="mb-2">
                          <span className="text-slate-500">{i + 1}</span>
                          <br />
                          {s.subtitle}
                        </p>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="quiz">
                    <QuizRunner questions={result.quiz} />
                  </TabsContent>
                  <TabsContent value="outline">
                    <ol className="space-y-2">
                      {result.slides.map((s, i) => (
                        <li key={i} className="rounded-md border border-border p-3">
                          <p className="text-[13px] font-semibold">{i + 1}. {s.title}</p>
                          <ul className="mt-1 list-disc pl-5 text-[12.5px] text-muted-foreground">
                            {s.bullets.map((b) => <li key={b}>{b}</li>)}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          ) : (
            <EmptyState
              className="py-20"
              icon={Sparkles}
              title="Noch keine Vorschau"
              description="Wählen Sie links Wissensquelle, Format, Zielgruppe und Schwierigkeitsgrad – und klicken Sie auf „Mit KI generieren“."
            />
          )}
        </Card>
      </div>

      {state.contents.length > 0 && (
        <Card>
          <SectionHeader title="Zuletzt generiert" description="Ihre letzten KI-generierten Inhalte" />
          <ul className="divide-y divide-border px-5 pb-2 pt-2">
            {state.contents.slice(0, 5).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[13px] font-medium">
                    <span className="truncate">{c.title}</span>
                    {c.tags?.includes('neu') && <Badge className="border-transparent bg-brand text-white">Neu</Badge>}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">{FORMAT_LABELS[c.format]} · {c.audience} · {formatRelative(c.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="xs" variant="ghost" onClick={() => { setResultId(c.id); setPreviewTab('main') }}>Vorschau</Button>
                  {c.savedModuleId && (
                    <Button size="xs" variant="outline" onClick={() => navigate(`/learning/${c.savedModuleId}`)}>Kurs öffnen</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
