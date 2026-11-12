import { useMemo, useState } from 'react'
import { CheckCircle2, CircleDashed, Clock, GraduationCap } from 'lucide-react'
import type { Employee, LearningModule } from '@/types'
import { Card, SectionHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { trainingStatusOf, type TrainingStatus } from '@/lib/training-status'

const STATUS_META: Record<
  TrainingStatus,
  { label: string; icon: React.ElementType; tile: string; active: string; bar: string; badge: 'success' | 'warning' | 'secondary' }
> = {
  abgeschlossen: {
    label: 'Abgeschlossen',
    icon: CheckCircle2,
    tile: 'border-success/25 bg-success/5 text-success hover:bg-success/10',
    active: 'ring-2 ring-success/40 bg-success/10',
    bar: 'bg-success',
    badge: 'success',
  },
  in_bearbeitung: {
    label: 'In Bearbeitung',
    icon: Clock,
    tile: 'border-warning/30 bg-warning/5 text-warning hover:bg-warning/10',
    active: 'ring-2 ring-warning/40 bg-warning/10',
    bar: 'bg-warning',
    badge: 'warning',
  },
  nicht_begonnen: {
    label: 'Nicht begonnen',
    icon: CircleDashed,
    tile: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
    active: 'ring-2 ring-slate-300 bg-slate-100',
    bar: 'bg-slate-400',
    badge: 'secondary',
  },
}

const ORDER: TrainingStatus[] = ['abgeschlossen', 'in_bearbeitung', 'nicht_begonnen']

export function TrainingStatusPanel({
  employees,
  modules,
  onSelect,
}: {
  employees: Employee[]
  modules: LearningModule[]
  onSelect: (employeeId: string) => void
}) {
  const [open, setOpen] = useState<TrainingStatus | null>(null)

  const rows = useMemo(
    () =>
      employees
        .map((e) => ({ employee: e, ...trainingStatusOf(e, modules) }))
        .sort((a, b) => b.percent - a.percent || a.employee.name.localeCompare(b.employee.name)),
    [employees, modules],
  )
  const counts = ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: rows.filter((r) => r.status === s).length }),
    {} as Record<TrainingStatus, number>,
  )
  const total = rows.length
  const done = counts.abgeschlossen
  const offen = total - done
  const list = open ? rows.filter((r) => r.status === open) : []

  return (
    <Card className="pb-5">
      <SectionHeader icon={GraduationCap} title="Trainingsstatus" description="Pflichttrainings nach Rolle" />
      <div className="space-y-4 px-6 pt-4">
        <div>
          <p className="text-[12.5px] text-muted-foreground">
            <span className="font-semibold text-foreground tabular">{total}</span> Mitarbeitende ·{' '}
            <span className="font-semibold text-success tabular">{done}</span> abgeschlossen ·{' '}
            <span className="font-semibold text-foreground tabular">{offen}</span> offen
          </p>
          <Progress value={total ? (done / total) * 100 : 0} className="mt-2" indicatorClassName="bg-success" label="Anteil abgeschlossener Pflichttrainings" />
        </div>

        <div className="grid gap-2">
          {ORDER.map((s) => {
            const meta = STATUS_META[s]
            const Icon = meta.icon
            const active = open === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                data-testid={`training-tile-${s}`}
                onClick={() => setOpen((o) => (o === s ? null : s))}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all',
                  meta.tile,
                  active && meta.active,
                )}
              >
                <span className="flex items-center gap-2 text-[13px] font-semibold">
                  <Icon className="size-4" /> {meta.label}
                </span>
                <span className="rounded bg-white px-1.5 text-[12px] font-semibold tabular text-slate-600 ring-1 ring-border">{counts[s]}</span>
              </button>
            )
          })}
        </div>

        {open && (
          <ul data-testid="training-list" className="divide-y divide-border rounded-2xl border border-border">
            {list.length === 0 && <li className="px-3 py-4 text-center text-[12px] text-slate-400">Keine Mitarbeitenden in diesem Status</li>}
            {list.map(({ employee: e, percent, required }) => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar initials={e.initials} tone={open === 'abgeschlossen' ? 'navy' : 'slate'} />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => onSelect(e.id)} className="block truncate text-left text-[13px] font-medium text-foreground hover:text-brand hover:underline">
                    {e.name}
                  </button>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {e.title} · {e.department}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={percent} className="h-1" indicatorClassName={STATUS_META[open].bar} label={`Fortschritt ${e.name}`} />
                    <span className="shrink-0 text-[11px] font-semibold tabular text-slate-600">{percent} %</span>
                  </div>
                </div>
                <Badge variant={STATUS_META[open].badge} className="shrink-0" title="Pflichtmodule für diese Rolle">
                  {required.length} Module
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
