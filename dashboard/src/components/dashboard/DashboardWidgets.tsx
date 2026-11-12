import { Link, useNavigate } from 'react-router-dom'
import type * as React from 'react'
import { ArrowRight, Bot, CircleCheck, Circle, FileUp, MessagesSquare, ShieldAlert, Sparkles, TriangleAlert, Users } from 'lucide-react'
import type { Activity, Expert } from '@/types'
import type { JourneyStep } from '@/hooks/useMetrics'
import { Card, SectionHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, EmptyState } from '@/components/ui/misc'
import { ACTIVITY_META } from '@/components/layout/activity-meta'
import { cn, formatDate, formatRelative } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import type { Permission } from '@/lib/permissions'

export function KnowledgeAtRisk({ experts }: { experts: Expert[] }) {
  const navigate = useNavigate()
  const { can } = useApp()
  return (
    <Card className="flex h-full flex-col border-danger/20">
      <SectionHeader
        title="Knowledge at Risk"
        description="Kritisches Wissen mit Handlungsbedarf"
        action={
          <span className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2 py-0.5 text-[11.5px] font-semibold text-danger">
            <TriangleAlert className="size-3" /> Hoch
          </span>
        }
      />
      <div className="px-5 pt-4">
        <div className="flex items-start gap-3 rounded-md border border-danger/15 bg-danger/[0.04] p-3.5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger" />
          <p className="text-[13.5px] leading-relaxed text-foreground">
            <span className="font-semibold">{experts.length} Experten</span> verfügen über kritisches Wissen, das noch nicht
            vollständig dokumentiert wurde.
          </p>
        </div>
      </div>
      <ul className="flex-1 space-y-3 px-5 py-4">
        {experts.slice(0, 3).map((e) => (
          <li key={e.id} className="flex items-center gap-3">
            <Avatar initials={e.initials} tone="slate" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-medium">{e.name}</p>
                <span className={cn('text-xs font-semibold tabular', e.knowledgeCoverage < 40 ? 'text-danger' : 'text-warning')}>
                  {e.knowledgeCoverage} %
                </span>
              </div>
              <p className="truncate text-[11.5px] text-muted-foreground">
                {e.focus}{e.retirement ? ` · bis ${formatDate(e.retirement)}` : ''}
              </p>
              <Progress
                value={e.knowledgeCoverage}
                className="mt-1.5 h-1"
                indicatorClassName={e.knowledgeCoverage < 40 ? 'bg-danger' : 'bg-warning'}
                label={`Wissenssicherung ${e.name}`}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="px-5 pb-5">
        <Button
          className="w-full"
          onClick={() =>
            can('interview.conduct')
              ? navigate('/expert-knowledge', { state: { startInterview: true, employeeId: experts[0]?.id } })
              : navigate('/workforce')
          }
        >
          Wissen jetzt sichern <ArrowRight />
        </Button>
      </div>
    </Card>
  )
}

export function RecentActivity({ activities }: { activities: Activity[] }) {
  return (
    <Card className="h-full">
      <SectionHeader title="Recent Activity" description="Aktuelle Aktivitäten im Wissensmanagement" />
      {activities.length === 0 ? (
        <EmptyState icon={Sparkles} title="Noch keine Aktivitäten" />
      ) : (
        <ol className="relative px-5 pb-5 pt-4">
          {activities.slice(0, 7).map((a, i, arr) => {
            const meta = ACTIVITY_META[a.type]
            const Icon = meta.icon
            return (
              <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < arr.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border" />}
                <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-md', meta.className)}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
                    <span className="text-[11.5px] text-slate-400">{formatRelative(a.timestamp)}</span>
                  </div>
                  <p className="truncate text-[12.5px] text-muted-foreground">{a.description}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-400">
                    <span>{a.actor}</span>
                    {a.link && (
                      <Link to={a.link} className="font-medium text-brand hover:underline">
                        Öffnen
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

export function QuickActions() {
  const navigate = useNavigate()
  const { can } = useApp()
  const all: { label: string; hint: string; icon: React.ElementType; onClick: () => void; permission?: Permission }[] = [
    { label: 'Dokument hochladen', hint: 'PDF, DOCX, PPTX, TXT', icon: FileUp, onClick: () => navigate('/documents'), permission: 'documents.manage' },
    { label: 'Experteninterview starten', hint: 'KI-geführtes Interview', icon: MessagesSquare, onClick: () => navigate('/expert-knowledge', { state: { startInterview: true } }), permission: 'interview.conduct' },
    { label: 'Lernmodul erstellen', hint: 'Folien, Video, Podcast, Quiz', icon: Sparkles, onClick: () => navigate('/content-studio'), permission: 'content.create' },
    { label: 'Workforce Board', hint: 'Austritte & Interviews', icon: Users, onClick: () => navigate('/workforce'), permission: 'board.view' },
    { label: 'KI-Assistent öffnen', hint: 'Fragen an die Wissensbasis', icon: Bot, onClick: () => navigate('/assistant') },
  ]
  const actions = all.filter((a) => !a.permission || can(a.permission)).slice(0, 4)
  return (
    <Card>
      <SectionHeader title="Quick Actions" description="Häufige Aufgaben direkt starten" />
      <div className="grid grid-cols-2 gap-2 p-5 pt-4">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="group flex flex-col items-start gap-2 rounded-md border border-border bg-white p-3 text-left transition-all hover:border-brand/40 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              <span className="grid size-8 place-items-center rounded-md bg-navy-50 text-navy-800 transition-colors group-hover:bg-brand group-hover:text-white">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold leading-tight text-foreground">{a.label}</span>
                <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{a.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export function DemoJourney({ steps }: { steps: JourneyStep[] }) {
  const done = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)
  return (
    <Card>
      <SectionHeader
        title="Demo Journey"
        description="Vom Dokument zum bestandenen Quiz"
        action={<span className="text-xs font-semibold text-muted-foreground tabular">{done}/{steps.length}</span>}
      />
      <div className="px-5 pt-3">
        <Progress value={(done / steps.length) * 100} label="Fortschritt Demo Journey" />
      </div>
      <ol className="space-y-1 p-3">
        {steps.map((s, i) => (
          <li key={s.id}>
            <Link
              to={s.path}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-slate-50',
                next?.id === s.id && 'bg-brand-50/60',
              )}
            >
              {s.done ? <CircleCheck className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0 text-slate-300" />}
              <span className={cn('flex-1', s.done ? 'text-muted-foreground line-through decoration-slate-300' : 'text-foreground')}>
                {i + 1}. {s.label}
              </span>
              {next?.id === s.id && <span className="text-[11px] font-semibold text-brand">Nächster Schritt</span>}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function WorkforceSummary({ counts }: { counts: Record<'aktiv' | 'austritt_geplant' | 'interview' | 'wissen_gesichert' | 'ausgeschieden' | 'newHires', number> }) {
  const navigate = useNavigate()
  const items = [
    { key: 'aktiv', label: 'Aktiv tätig', value: counts.aktiv, dot: 'bg-success' },
    { key: 'austritt_geplant', label: 'Interview geplant', value: counts.austritt_geplant, dot: 'bg-warning' },
    { key: 'interview', label: 'Im KI-Interview', value: counts.interview, dot: 'bg-brand' },
    { key: 'wissen_gesichert', label: 'Wissen gesichert', value: counts.wissen_gesichert, dot: 'bg-navy-800' },
    { key: 'ausgeschieden', label: 'Ausgeschieden', value: counts.ausgeschieden, dot: 'bg-slate-400' },
    { key: 'newHires', label: 'In Einarbeitung', value: counts.newHires, dot: 'bg-brand-300' },
  ]
  return (
    <Card>
      <SectionHeader
        title="Wissenstransfer im Überblick"
        description="Belegte Rollen, Austritte und laufende KI-Interviews"
        action={
          <Button size="sm" variant="outline" onClick={() => navigate('/workforce')}>
            Workforce Board <ArrowRight />
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-lg border-t border-border bg-border mt-4 sm:grid-cols-3 xl:grid-cols-6">
        {items.map((i) => (
          <button
            key={i.key}
            type="button"
            onClick={() => navigate('/workforce')}
            className="bg-white px-5 py-4 text-left transition-colors hover:bg-slate-50"
          >
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
              <span className={cn('size-2 rounded-full', i.dot)} /> {i.label}
            </span>
            <span className="mt-1 block text-2xl font-semibold tabular">{i.value}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

export function ReviewAlert() {
  const { state, user, can } = useApp()
  const navigate = useNavigate()
  const open = state.reviews.filter((r) => r.status === 'offen' && (can('board.allDepartments') || r.department === user.department))
  if (!open.length) return null
  const first = open[0]
  return (
    <Card className="flex flex-col gap-3 border-l-[3px] border-l-danger p-4 sm:flex-row sm:items-center">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-danger/10 text-danger">
        <ShieldAlert className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">
          {open.length} {open.length === 1 ? 'Aussage wartet' : 'Aussagen warten'} auf Ihre Vier-Augen-Prüfung
        </p>
        <p className="truncate text-[13px] text-muted-foreground">
          Zuletzt: {first.employeeName} · „{first.topic}“ · Plausibilität {first.plausibility.score} %
        </p>
      </div>
      <Button onClick={() => navigate('/reviews')}>
        Jetzt prüfen <ArrowRight />
      </Button>
    </Card>
  )
}
