import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Briefcase, Clapperboard, EyeOff, Lock, MessagesSquare, Plus, Sparkles, Users } from 'lucide-react'
import type { Employee, EmployeeStatus, InterviewTrigger } from '@/types'
import { PageHeader, KeyValue, Avatar, EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NativeSelect, SearchInput } from '@/components/ui/inputs'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { EmployeeCard, monthsUntil } from '@/components/workforce/EmployeeCard'
import { TransferPipeline } from '@/components/workforce/TransferPipeline'
import { TrainingStatusPanel } from '@/components/workforce/TrainingStatusPanel'
import { useApp } from '@/context/AppContext'
import { DEPARTMENTS } from '@/data/mock-data'
import { BOARD_STATUS_ORDER, EMPLOYEE_STATUS_META, EMPLOYEE_STATUS_ORDER, ROLE_LABELS } from '@/lib/permissions'
import { TRIGGER_META, TRIGGER_ORDER, triggerOf } from '@/lib/triggers'
import { Label } from '@/components/ui/inputs'
import { cn, formatDate } from '@/lib/utils'

export default function WorkforcePage() {
  const { state, user, can, moveEmployee, planInterview, startEmployeeInterview } = useApp()
  const navigate = useNavigate()
  const { toast } = useToast()
  const allDepartments = can('board.allDepartments')
  const canEdit = can('board.edit')
  const canInterview = can('interview.conduct')
  const showExitReason = can('board.exitDetails')

  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState<string>(allDepartments ? 'alle' : user.department)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<EmployeeStatus | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [planOpen, setPlanOpen] = useState(false)
  const [plan, setPlan] = useState<{ employeeId: string; trigger: InterviewTrigger; date: string }>({ employeeId: '', trigger: 'projektende', date: '' })

  const scopeDepartment = allDepartments ? department : user.department
  const visible = useMemo(
    () =>
      state.employees.filter(
        (e) =>
          (scopeDepartment === 'alle' || e.department === scopeDepartment) &&
          `${e.name} ${e.title} ${e.jobRole} ${e.projects.map((p) => p.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [state.employees, scopeDepartment, query],
  )

  const byStatus = (status: EmployeeStatus) =>
    visible
      .filter((e) => e.status === status)
      .sort((a, b) => (a.exitDate ?? '9999').localeCompare(b.exitDate ?? '9999') || a.name.localeCompare(b.name))

  const detail = state.employees.find((e) => e.id === detailId) ?? null

  const openInterview = (e: Employee) => {
    if (!canInterview) {
      toast({ title: 'Keine Berechtigung', description: `Ihre Rolle „${ROLE_LABELS[user.appRole]}“ darf keine KI-Interviews führen.`, variant: 'warning' })
      return
    }
    const id = e.status === 'interview' && e.interviewId ? e.interviewId : startEmployeeInterview(e.id)
    navigate('/expert-knowledge', { state: { interviewId: id } })
  }

  const createVideo = (e: Employee) => {
    const interview = state.interviews.find((i) => i.id === e.interviewId)
    const articleIds = interview?.savedArticleIds ?? []
    navigate('/content-studio', { state: { articleIds, format: 'video', audience: 'Anfänger' } })
  }

  const primaryAction = (e: Employee) => {
    if (e.status === 'austritt_geplant' || e.status === 'interview') return canInterview ? () => openInterview(e) : undefined
    if (e.status === 'wissen_gesichert' && e.moduleIds.length === 0 && can('content.create')) return () => createVideo(e)
    return undefined
  }

  const drop = (status: EmployeeStatus) => {
    const e = state.employees.find((x) => x.id === dragId)
    setDragId(null)
    setOverColumn(null)
    if (!e || e.status === status) return
    if (!canEdit) {
      toast({ title: 'Keine Berechtigung', description: 'Ihre Rolle darf den Status nicht ändern.', variant: 'warning' })
      return
    }
    if (status === 'interview') {
      if (!canInterview) {
        moveEmployee(e.id, status)
        return
      }
      const id = startEmployeeInterview(e.id)
      toast({
        title: `KI-Interview für ${e.name} gestartet`,
        description: 'Die KI fragt nach Vorgehen, Werkzeugen und Stolperfallen der Projekte.',
        variant: 'success',
        action: id ? { label: 'Interview öffnen', onClick: () => navigate('/expert-knowledge', { state: { interviewId: id } }) } : undefined,
      })
      return
    }
    if (status === 'ausgeschieden' && e.moduleIds.length === 0 && e.status !== 'wissen_gesichert') {
      toast({ title: 'Achtung: Wissen nicht gesichert', description: `${e.name} scheidet aus, ohne dass Erklärvideos existieren.`, variant: 'warning' })
    }
    moveEmployee(e.id, status)
  }

  const candidates = visible.filter((e) => e.status === 'aktiv' && !e.isNewHire)
  const openPlan = () => {
    setPlan({ employeeId: candidates[0]?.id ?? '', trigger: 'projektende', date: '' })
    setPlanOpen(true)
  }
  const submitPlan = () => {
    const e = state.employees.find((x) => x.id === plan.employeeId)
    if (!e) return
    planInterview(e.id, plan.trigger, plan.date || undefined)
    setPlanOpen(false)
    toast({ title: `Interview für ${e.name} geplant`, description: `${TRIGGER_META[plan.trigger].label} → ${TRIGGER_META[plan.trigger].agent}`, variant: 'success' })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workforce Board"
        description="Wer wird interviewt, aus welchem Anlass – und welcher KI-Agent sichert das Wissen?"
        actions={
          <Badge variant="outline" className="gap-1.5 py-1">
            <Lock /> Ansicht: {ROLE_LABELS[user.appRole]}
            {!allDepartments && ` · nur ${user.department}`}
          </Badge>
        }
      />

      <TransferPipeline employees={visible} compact />

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            wrapperClassName="flex-1"
            placeholder="Name, Rolle oder Projekt suchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Mitarbeitende durchsuchen"
          />
          <NativeSelect
            value={scopeDepartment}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={!allDepartments}
            aria-label="Abteilung filtern"
            className="md:w-60"
          >
            <option value="alle">Alle Abteilungen</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </NativeSelect>
          <p className="text-[12px] text-muted-foreground md:max-w-xs">
            {canEdit ? 'Karten per Drag & Drop verschieben – „Im KI-Interview“ startet das Interview automatisch.' : 'Nur Leserechte für diese Ansicht.'}
          </p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="min-w-0">
      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Keine Mitarbeitenden gefunden" description="Passen Sie Suche oder Abteilung an." />
        </Card>
      ) : (
        <div className="grid auto-cols-[minmax(250px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {BOARD_STATUS_ORDER.map((status) => {
            const items = byStatus(status)
            const meta = EMPLOYEE_STATUS_META[status]
            return (
              <section
                key={status}
                aria-label={meta.label}
                onDragOver={(ev) => {
                  if (!dragId) return
                  ev.preventDefault()
                  setOverColumn(status)
                }}
                onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
                onDrop={(ev) => {
                  ev.preventDefault()
                  drop(status)
                }}
                className={cn(
                  'flex min-h-[420px] flex-col rounded-[22px] bg-black/[0.035] transition-colors',
                  overColumn === status && 'border-brand/50 bg-brand-50/60',
                )}
              >
                <header className={cn('rounded-t-[22px] border-t-[3px] px-4 py-3', meta.header)}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-[13px] font-semibold">
                      <span className={cn('size-2 rounded-full', meta.dot)} /> {meta.label}
                    </h2>
                    <span className="rounded bg-white px-1.5 text-[12px] font-semibold tabular text-slate-600 ring-1 ring-border">{items.length}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{meta.description}</p>
                  {status === 'austritt_geplant' && canEdit && (
                    <button
                      type="button"
                      onClick={openPlan}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/60 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-brand/40 hover:text-brand"
                    >
                      <Plus className="size-3.5" /> Anlass melden
                    </button>
                  )}
                </header>
                <div className="flex-1 space-y-2.5 p-3">
                  {items.map((e) => (
                    <EmployeeCard
                      key={e.id}
                      employee={e}
                      interview={state.interviews.find((i) => i.id === e.interviewId)}
                      showExitReason={showExitReason}
                      draggable={canEdit}
                      dragging={dragId === e.id}
                      onDragStart={() => setDragId(e.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverColumn(null)
                      }}
                      onOpen={() => setDetailId(e.id)}
                      onPrimary={primaryAction(e)}
                    />
                  ))}
                  {items.length === 0 && <p className="px-2 py-6 text-center text-[12px] text-slate-400">Keine Einträge</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}
      </div>
      <TrainingStatusPanel employees={visible} modules={state.modules} onSelect={setDetailId} />
      </div>

      <Dialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetailId(null)}
        title={detail?.name ?? ''}
        description={detail ? `${detail.title} · ${detail.department}` : undefined}
        className="max-w-xl"
        footer={
          detail && (
            <>
              {canEdit && (
                <NativeSelect
                  value={detail.status}
                  onChange={(ev) => {
                    const status = ev.target.value as EmployeeStatus
                    if (status === 'interview' && canInterview) startEmployeeInterview(detail.id)
                    else moveEmployee(detail.id, status)
                  }}
                  aria-label="Status ändern"
                  className="w-48"
                >
                  {EMPLOYEE_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{EMPLOYEE_STATUS_META[s].label}</option>
                  ))}
                </NativeSelect>
              )}
              {(detail.status === 'austritt_geplant' || detail.status === 'interview') && canInterview && (
                <Button onClick={() => openInterview(detail)}>
                  <MessagesSquare /> {detail.status === 'interview' ? 'Interview öffnen' : 'KI-Interview starten'}
                </Button>
              )}
              {detail.status === 'wissen_gesichert' && can('content.create') && (
                <Button onClick={() => createVideo(detail)}>
                  <Sparkles /> Erklärvideo erstellen
                </Button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar initials={detail.initials} className="size-11 text-[13px]" />
              <div>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                  <span className={cn('size-2 rounded-full', EMPLOYEE_STATUS_META[detail.status].dot)} />
                  {EMPLOYEE_STATUS_META[detail.status].label}
                </span>
                <p className="text-[12px] text-muted-foreground">Rolle: {detail.jobRole}</p>
              </div>
            </div>
            <dl className="divide-y divide-border rounded-md border border-border px-3">
              {detail.status !== 'aktiv' && (
                <KeyValue label="Anlass">{TRIGGER_META[triggerOf(detail)].label}</KeyValue>
              )}
              {detail.status !== 'aktiv' && (
                <KeyValue label="KI-Agent">
                  <span className="inline-flex items-center gap-1.5"><Bot className="size-3.5 text-brand" /> {TRIGGER_META[triggerOf(detail)].agent}</span>
                </KeyValue>
              )}
              <KeyValue label="Im Unternehmen seit">{formatDate(detail.since)} ({detail.yearsOfService} Jahre)</KeyValue>
              {detail.exitDate && (
                <KeyValue label={{ ruhestand: 'Ruhestand', austritt: 'Austritt', wechsel: 'Wechsel', projektende: 'Projektende', schluesselwissen: 'Stichtag' }[triggerOf(detail)]}>
                  {formatDate(detail.exitDate)}
                  {(() => {
                    const m = monthsUntil(detail.exitDate)
                    return m !== null && m >= 0 && detail.status !== 'ausgeschieden' ? ` · in ${m} Monaten` : ''
                  })()}
                </KeyValue>
              )}
              {detail.exitDate && triggerOf(detail) === 'austritt' && (
                <KeyValue label="Austrittsgrund">
                  {showExitReason ? (
                    detail.exitReason
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><EyeOff className="size-3.5" /> vertraulich (nur HR & Knowledge Management)</span>
                  )}
                </KeyValue>
              )}
              <KeyValue label="Wissenssicherung">{detail.knowledgeCoverage} %</KeyValue>
              {detail.successorRole && <KeyValue label="Videos für Rolle">{detail.successorRole}</KeyValue>}
            </dl>
            {detail.projects.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  <Briefcase className="size-3.5" /> Projekte
                </p>
                <ul className="space-y-2">
                  {detail.projects.map((p) => (
                    <li key={p.name} className="rounded-md border border-border p-2.5">
                      <p className="text-[13px] font-medium">{p.name}</p>
                      <p className="text-[12px] text-muted-foreground">{p.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.moduleIds.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  <Clapperboard className="size-3.5" /> Erklärvideos aus diesem Wissen
                </p>
                <ul className="space-y-1">
                  {detail.moduleIds.map((id) => {
                    const m = state.modules.find((x) => x.id === id)
                    return m ? (
                      <li key={id}>
                        <button type="button" onClick={() => navigate(`/learning/${id}`)} className="text-[13px] font-medium text-brand hover:underline">
                          {m.title}
                        </button>
                      </li>
                    ) : null
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        title="Anlass melden"
        description="Die Person erscheint unter „Interview geplant“ – der passende KI-Agent wird automatisch zugeordnet."
        className="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>Abbrechen</Button>
            <Button onClick={submitPlan} disabled={!plan.employeeId}>Interview planen</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="plan-person">Person</Label>
            <NativeSelect id="plan-person" value={plan.employeeId} onChange={(ev) => setPlan((p) => ({ ...p, employeeId: ev.target.value }))}>
              {candidates.length === 0 && <option value="">Keine aktiven Mitarbeitenden</option>}
              {candidates.map((e) => (
                <option key={e.id} value={e.id}>{e.name} – {e.title}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Anlass</Label>
            <div className="grid gap-2" role="radiogroup" aria-label="Anlass">
              {TRIGGER_ORDER.map((t) => {
                const m = TRIGGER_META[t]
                const Icon = m.icon
                const active = plan.trigger === t
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPlan((p) => ({ ...p, trigger: t }))}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-3 text-left transition-all',
                      active ? 'border-brand/40 bg-brand-50/60 shadow-card' : 'border-black/[0.06] bg-white hover:border-slate-300',
                    )}
                  >
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white', m.tone)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold">{m.label}</span>
                      <span className="block text-[12px] text-muted-foreground">→ {m.agent} · {m.goal}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          {plan.trigger !== 'schluesselwissen' && (
            <div className="space-y-1.5">
              <Label htmlFor="plan-date">Stichtag (optional)</Label>
              <input
                id="plan-date"
                type="date"
                value={plan.date}
                onChange={(ev) => setPlan((p) => ({ ...p, date: ev.target.value }))}
                className="h-10 w-full rounded-xl bg-black/[0.04] px-3 text-[14px] outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
