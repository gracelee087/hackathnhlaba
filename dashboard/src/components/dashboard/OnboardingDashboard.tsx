import { thumbTone } from '@/lib/tones'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, CircleCheck, CirclePlay, Clapperboard, Clock, EyeOff, Sparkles, Target, Trophy, Users } from 'lucide-react'
import type { LearningModule } from '@/types'
import { Avatar } from '@/components/ui/misc'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Card, SectionHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress, ProgressRing } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { useApp } from '@/context/AppContext'
import { getModuleProgress } from '@/lib/learning'
import { cn, formatDateLong } from '@/lib/utils'

function VideoTile({ module, index }: { module: LearningModule; index: number }) {
  const { state } = useApp()
  const p = getModuleProgress(module, state.progress)
  const isNew = !module.seed
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Link
        to={`/learning/${module.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <div className={`relative aspect-video ${thumbTone(index)}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.22),transparent_55%)]" />
          <p className="absolute left-3 top-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/85">{module.category}</p>
          {isNew && <span className="absolute right-3 top-3 rounded bg-brand px-1.5 py-0.5 text-[10.5px] font-semibold text-white">Neu</span>}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-white/95 text-navy-800 shadow-pop transition-transform group-hover:scale-105">
              {p.status === 'abgeschlossen' ? <CircleCheck className="size-6 text-success" /> : <CirclePlay className="size-6" />}
            </span>
          </span>
          <span className="absolute bottom-2 right-3 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">
            <Clock className="size-3" /> {module.durationMin} Min.
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="text-[14px] font-semibold leading-snug group-hover:text-brand-700">{module.title}</h3>
          {module.sourceExperts && module.sourceExperts.length > 0 && (
            <p className="mt-1 text-[12px] text-muted-foreground">Wissen von {module.sourceExperts.join(', ')}</p>
          )}
          <div className="mt-auto pt-3">
            <div className="mb-1 flex justify-between text-[11.5px] text-muted-foreground">
              <span>{p.completed}/{p.total} Kapitel</span>
              <span className="tabular">{p.percent} %</span>
            </div>
            <Progress value={p.percent} indicatorClassName={p.status === 'abgeschlossen' ? 'bg-success' : undefined} label={`Fortschritt ${module.title}`} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/** Dashboard für neue Mitarbeitende: nur die für ihre Rolle relevanten Erklärvideos. */
export function OnboardingDashboard() {
  const { state, user } = useApp()
  const navigate = useNavigate()
  const relevant = state.modules.filter((m) => m.targetRoles.includes(user.jobRole))
  const hidden = state.modules.length - relevant.length
  const progress = relevant.map((m) => getModuleProgress(m, state.progress))
  const totalChapters = progress.reduce((s, p) => s + p.total, 0)
  const doneChapters = progress.reduce((s, p) => s + p.completed, 0)
  const percent = totalChapters ? Math.round((doneChapters / totalChapters) * 100) : 0
  const next = relevant.find((m) => getModuleProgress(m, state.progress).status !== 'abgeschlossen')
  const minutes = relevant.reduce((s, m) => s + m.durationMin, 0)
  const contacts = state.employees
    .filter((e) => e.department === user.department && !e.isNewHire && (e.status === 'aktiv' || e.status === 'austritt_geplant' || e.status === 'wissen_gesichert'))
    .slice(0, 4)
  const firstName = user.name.split(' ')[0]

  return (
    <div className="space-y-6">
      <HeroBanner
        eyebrow={formatDateLong(new Date())}
        title={`Willkommen, ${firstName}.`}
        subtitle={
          <>
            Deine Einarbeitung als <span className="font-semibold text-white">{user.jobRole}</span> – mit dem Erfahrungswissen der Kolleginnen und
            Kollegen, die diese Aufgaben jahrelang gemacht haben. Du siehst nur, was du für deine Rolle brauchst.
          </>
        }
        actions={
          <>
            {next && (
              <Button className="bg-white text-navy-800 hover:bg-slate-100" onClick={() => navigate(`/learning/${next.id}`)}>
                <CirclePlay /> Weiter mit „{next.title.length > 42 ? `${next.title.slice(0, 41)}…` : next.title}“
              </Button>
            )}
            <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate('/assistant')}>
              <Bot /> Frage stellen
            </Button>
          </>
        }
        stats={[
          { label: 'Fortschritt', value: `${percent} %`, hint: `${doneChapters} von ${totalChapters} Kapiteln` },
          { label: 'Deine Videos', value: relevant.length, hint: `ca. ${minutes} Min. Lernzeit` },
          { label: 'Ausgeblendet', value: hidden, hint: 'nicht relevant für dich' },
        ]}
      />

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[16px] font-semibold"><Target className="size-4 text-brand" /> Deine Erklärvideos</h2>
            <p className="text-[13px] text-muted-foreground">Gefiltert auf die Rolle „{user.jobRole}“</p>
          </div>
        </div>
        {relevant.length === 0 ? (
          <Card className="p-8 text-center text-[13px] text-muted-foreground">
            Für deine Rolle wurden noch keine Erklärvideos erstellt.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {relevant.map((m, i) => (
              <VideoTile key={m.id} module={m} index={i} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader icon={Users} title="Deine Ansprechpartner:innen" description={user.department} />
          <ul className="divide-y divide-border px-5 pb-3 pt-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <Avatar initials={c.initials} tone="slate" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{c.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{c.title}</p>
                </div>
                {c.projects[0] && <span className="hidden max-w-[45%] truncate text-[11.5px] text-slate-500 sm:block">{c.projects[0].name}</span>}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionHeader icon={Trophy} title="So funktioniert deine Einarbeitung" />
          <ol className="space-y-3 p-5 pt-4 text-[13px]">
            {[
              'Video ansehen – erklärt von erfahrenen Kolleg:innen',
              'Folien und Sprechertext zum Nachlesen nutzen',
              'Quiz mit mindestens 80 % bestehen, dann wird das nächste Kapitel freigeschaltet',
              'Offene Fragen jederzeit an den KI-Assistenten stellen',
            ].map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold', i === 0 ? 'bg-brand text-white' : 'bg-navy-50 text-navy-800')}>
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
          <div className="px-5 pb-5">
            <Link to="/learning" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline">
              <Sparkles className="size-3.5" /> Alle meine Kurse <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
