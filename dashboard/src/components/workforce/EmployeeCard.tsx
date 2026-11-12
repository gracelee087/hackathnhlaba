import { Bot, CalendarX, Clapperboard, EyeOff, GripVertical, MessagesSquare, Sparkles, TriangleAlert, UserPlus } from 'lucide-react'
import type { Employee, ExpertInterview } from '@/types'
import { Avatar } from '@/components/ui/misc'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { TRIGGER_META, triggerOf } from '@/lib/triggers'

export function monthsUntil(iso?: string) {
  if (!iso) return null
  const now = new Date()
  const d = new Date(iso)
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
}

export function EmployeeCard({
  employee: e,
  interview,
  showExitReason,
  draggable,
  onOpen,
  onPrimary,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  employee: Employee
  interview?: ExpertInterview
  showExitReason: boolean
  draggable: boolean
  onOpen: () => void
  onPrimary?: () => void
  onDragStart: () => void
  onDragEnd: () => void
  dragging: boolean
}) {
  const months = monthsUntil(e.exitDate)
  const topicsDone = interview?.topics.filter((t) => t.done).length ?? 0
  const topicsTotal = interview?.topics.length ?? 0
  const lost = e.status === 'ausgeschieden' && e.moduleIds.length === 0
  const trigger = triggerOf(e)
  const tm = TRIGGER_META[trigger]
  const TIcon = tm.icon
  const dateLabel = { ruhestand: 'Ruhestand', austritt: 'Austritt', wechsel: 'Wechsel', projektende: 'Projektende', schluesselwissen: 'Stichtag' }[trigger]

  const primary =
    e.status === 'austritt_geplant'
      ? { label: 'KI-Interview starten', icon: MessagesSquare }
      : e.status === 'interview'
        ? { label: 'Interview öffnen', icon: MessagesSquare }
        : e.status === 'wissen_gesichert' && e.moduleIds.length === 0
          ? { label: 'Erklärvideo erstellen', icon: Sparkles }
          : null

  return (
    <div
      draggable={draggable}
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/plain', e.id)
        ev.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter') onOpen()
      }}
      aria-label={`${e.name}, Details öffnen`}
      className={cn(
        'group cursor-pointer rounded-2xl border border-black/[0.05] bg-white p-3.5 shadow-card transition-all hover:border-slate-300 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
        dragging && 'opacity-40',
        lost && 'border-danger/30',
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar initials={e.initials} tone={e.isNewHire ? 'brand' : 'slate'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{e.name}</p>
          <p className="truncate text-[11.5px] text-muted-foreground">{e.title}</p>
        </div>
        {draggable && <GripVertical className="size-4 shrink-0 text-slate-300 group-hover:text-slate-400" aria-hidden="true" />}
      </div>

      <p className="mt-2 truncate text-[11.5px] text-slate-500">{e.department}</p>

      {e.status !== 'aktiv' && (
        <div className="mt-2.5 overflow-hidden rounded-xl bg-slate-50 ring-1 ring-black/[0.04]">
          <p className="flex items-center gap-1.5 px-2.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Anlass</p>
          <div className="flex items-center gap-2 px-2.5 pb-2 pt-1">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', tm.chip)}>
              <TIcon className="size-3" /> {tm.label}
            </span>
          </div>
          <div className="flex items-center gap-2 border-t border-black/[0.04] bg-white/70 px-2.5 py-2">
            <span className={cn('grid size-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white', tm.tone)}>
              <Bot className="size-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11.5px] font-semibold text-foreground">{tm.agent}</span>
              <span className="block truncate text-[10.5px] text-muted-foreground">{tm.goal}</span>
            </span>
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {e.criticality === 'hoch' && e.status !== 'aktiv' && (
          <span className="rounded border border-danger/25 bg-danger/[0.06] px-1.5 py-0.5 text-[10.5px] font-semibold text-danger">Kritisches Wissen</span>
        )}
        {e.isNewHire && (
          <span className="inline-flex items-center gap-1 rounded border border-brand/20 bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand-700">
            <UserPlus className="size-3" /> Neu · seit {formatDate(e.since)}
          </span>
        )}
      </div>

      {e.exitDate && e.status !== 'aktiv' && (
        <div className="mt-2 space-y-0.5 text-[11.5px]">
          <p className="flex flex-wrap items-center gap-x-1.5 text-foreground">
            <CalendarX className="size-3.5 text-slate-400" />
            <span className="whitespace-nowrap">
              {e.status === 'ausgeschieden' ? 'Ausgeschieden' : dateLabel} {formatDate(e.exitDate)}
            </span>
            {months !== null && months >= 0 && e.status !== 'ausgeschieden' && (
              <span className={cn('whitespace-nowrap font-semibold', months <= 3 ? 'text-danger' : 'text-muted-foreground')}>· in {months} Mon.</span>
            )}
          </p>
          {trigger === 'austritt' && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            {showExitReason ? (
              <>Grund: {e.exitReason}</>
            ) : (
              <>
                <EyeOff className="size-3.5" /> Grund: vertraulich
              </>
            )}
          </p>
          )}
        </div>
      )}

      {e.status === 'interview' && interview && (
        <div className="mt-2.5">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Interview: {topicsDone}/{topicsTotal} Themen</span>
            <span className="tabular">{Math.round((topicsDone / Math.max(1, topicsTotal)) * 100)} %</span>
          </div>
          <Progress value={(topicsDone / Math.max(1, topicsTotal)) * 100} className="h-1" label="Interviewfortschritt" />
        </div>
      )}

      {(e.status === 'wissen_gesichert' || e.status === 'ausgeschieden') && (
        <p className={cn('mt-2 flex items-center gap-1.5 text-[11.5px] font-medium', lost ? 'text-danger' : 'text-success')}>
          {lost ? <TriangleAlert className="size-3.5" /> : <Clapperboard className="size-3.5" />}
          {lost ? 'Wissen nicht gesichert' : `${e.moduleIds.length} Erklärvideo${e.moduleIds.length === 1 ? '' : 's'} für die Nachfolge`}
        </p>
      )}

      {primary && onPrimary && (
        <Button
          size="xs"
          variant={e.status === 'austritt_geplant' ? 'default' : 'outline'}
          className="mt-2.5 w-full"
          onClick={(ev) => {
            ev.stopPropagation()
            onPrimary()
          }}
        >
          <primary.icon /> {primary.label}
        </Button>
      )}
    </div>
  )
}
