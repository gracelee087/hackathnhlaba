import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, BookOpenCheck, CircleCheck, Clock, GraduationCap, Lock, Route, Sparkles, Target } from 'lucide-react'
import { PageHeader, EmptyState } from '@/components/ui/misc'
import { Card, SectionHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { CourseCard } from '@/components/learning/CourseCard'
import { useApp } from '@/context/AppContext'
import { PASSING_SCORE, getModuleProgress, getOverallLearningStats } from '@/lib/learning'
import { cn } from '@/lib/utils'

type Filter = 'alle' | 'in_bearbeitung' | 'abgeschlossen' | 'ki'

const PATHS = [
  { id: 'p1', title: 'Einstieg Bausparen', description: 'Für neue Mitarbeitende in Beratung und Bestandsverwaltung', modules: ['m-grundlagen', 'm-tarife'] },
  { id: 'p2', title: 'Finanzierung & Regulatorik', description: 'Für Beraterinnen und Berater in der Immobilienfinanzierung', modules: ['m-finanzierung', 'm-regulatorik'] },
]

export default function LearningAcademyPage() {
  const { state, user, can } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('alle')
  const seeAll = can('learning.all')
  const scoped = useMemo(() => (seeAll ? state.modules : state.modules.filter((m) => m.targetRoles.includes(user.jobRole))), [seeAll, state.modules, user.jobRole])
  const stats = getOverallLearningStats(scoped, state.progress)

  const modules = useMemo(
    () =>
      scoped.filter((m) => {
        const p = getModuleProgress(m, state.progress)
        if (filter === 'in_bearbeitung') return p.status === 'in_bearbeitung'
        if (filter === 'abgeschlossen') return p.status === 'abgeschlossen'
        if (filter === 'ki') return m.generated
        return true
      }),
    [scoped, state.progress, filter],
  )

  const generatedPath = state.modules.filter((m) => !m.seed)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learning Academy"
        description={seeAll ? 'Individuell lernen. Wissen nachhaltig aufbauen.' : `Individuell lernen – gefiltert auf deine Rolle „${user.jobRole}“.`}
        actions={
          can('content.create') ? (
            <Button variant="outline" onClick={() => navigate('/content-studio')}>
              <Sparkles /> Neues Lernmodul generieren
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Verfügbare Kurse" value={scoped.length} icon={GraduationCap} trend="neutral" delta={`${scoped.filter((m) => m.generated).length} davon KI-generiert`} />
        <StatCard index={1} label="Abgeschlossene Kapitel" value={`${stats.completedChapters}/${stats.totalChapters}`} icon={BookOpenCheck} progress={stats.completionRate} />
        <StatCard index={2} label="Ø Quiz-Score" value={stats.avgScore ? `${stats.avgScore} %` : '–'} icon={Target} trend="neutral" delta={`Bestehensgrenze ${PASSING_SCORE} %`} />
        <StatCard index={3} label="Lernzeit" value={`${stats.minutes} Min.`} icon={Clock} trend="neutral" delta="aus abgeschlossenen Kapiteln" />
      </div>

      {seeAll && (
      <Card>
        <SectionHeader icon={Route} title="Lernpfade" description="Adaptive Pfade – jeder Kurs wird nach erfolgreichem Abschluss des vorherigen empfohlen" />
        <div className="grid gap-4 p-5 pt-4 lg:grid-cols-2">
          {[...PATHS, ...(generatedPath.length ? [{ id: 'p3', title: 'Neu aus Expertenwissen', description: 'KI-generierte Module aus aktuellen Interviews', modules: generatedPath.map((m) => m.id) }] : [])].map((path) => {
            const mods = path.modules.map((id) => state.modules.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => Boolean(m))
            const pct = mods.length ? Math.round(mods.reduce((s, m) => s + getModuleProgress(m, state.progress).percent, 0) / mods.length) : 0
            return (
              <div key={path.id} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold">{path.title}</p>
                    <p className="text-[12px] text-muted-foreground">{path.description}</p>
                  </div>
                  <span className="text-[13px] font-semibold tabular">{pct} %</span>
                </div>
                <Progress value={pct} className="mt-3" label={`Fortschritt ${path.title}`} />
                <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  {mods.map((m, i) => {
                    const p = getModuleProgress(m, state.progress)
                    const prevDone = i === 0 || getModuleProgress(mods[i - 1], state.progress).status === 'abgeschlossen'
                    const locked = !prevDone && p.status === 'offen'
                    return (
                      <li key={m.id} className="flex flex-1 items-center gap-2">
                        <Link
                          to={`/learning/${m.id}`}
                          className={cn(
                            'flex flex-1 items-center gap-2.5 rounded-md border px-3 py-2.5 text-[12.5px] transition-colors hover:bg-slate-50',
                            p.status === 'abgeschlossen' && 'border-success/30 bg-success/[0.04]',
                            locked && 'opacity-60',
                          )}
                        >
                          {p.status === 'abgeschlossen' ? <CircleCheck className="size-4 shrink-0 text-success" /> : locked ? <Lock className="size-4 shrink-0 text-slate-400" /> : <Award className="size-4 shrink-0 text-brand" />}
                          <span className="min-w-0 flex-1 truncate font-medium">{m.title}</span>
                          <span className="text-[11px] text-muted-foreground tabular">{p.percent}%</span>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )
          })}
        </div>
      </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[16px] font-semibold">Kursübersicht</h2>
        <Segmented
          ariaLabel="Kurse filtern"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'alle', label: 'Alle' },
            { value: 'in_bearbeitung', label: 'In Bearbeitung' },
            { value: 'abgeschlossen', label: 'Abgeschlossen' },
            { value: 'ki', label: 'KI-generiert' },
          ]}
        />
      </div>

      {modules.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title="Keine Kurse in dieser Ansicht" description="Wählen Sie einen anderen Filter oder generieren Sie ein neues Lernmodul." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {modules.map((m, i) => <CourseCard key={m.id} module={m} progress={state.progress} index={i} />)}
        </div>
      )}
    </div>
  )
}
