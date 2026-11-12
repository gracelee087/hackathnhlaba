import type * as React from 'react'
import { CalendarClock, CircleCheck, Circle, CircleHelp, CircleX, FileText, Lightbulb, ListChecks, Scale, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { plausibilityMeta } from '@/lib/plausibility'
import type { ExpertInterview } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress, ProgressRing } from '@/components/ui/progress'
import { Avatar } from '@/components/ui/misc'
import { interviewCompleteness } from '@/lib/interview'
import { cn, formatDate, formatRelative } from '@/lib/utils'
import { TRIGGER_META, triggerOf } from '@/lib/triggers'

function PanelSection({ title, icon: Icon, count, children }: { title: string; icon: React.ElementType; count?: number; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-4 py-4 first:border-t-0">
      <h3 className="mb-3 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="size-3.5" />
        <span className="flex-1">{title}</span>
        {count !== undefined && <span className="rounded bg-slate-100 px-1.5 text-[10.5px] text-slate-600">{count}</span>}
      </h3>
      {children}
    </section>
  )
}

function monthsUntil(iso: string) {
  const now = new Date()
  const d = new Date(iso)
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
}

export function InterviewInfoPanel({
  interview,
  interviews,
  onSelect,
  onNew,
}: {
  interview: ExpertInterview
  interviews: ExpertInterview[]
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const { state } = useApp()
  const doneTopics = interview.topics.filter((t) => t.done).length
  const months = monthsUntil(interview.expert.retirement)
  const agentEmployee = state.employees.find((e) => e.id === interview.employeeId)
  const agentMeta = agentEmployee ? TRIGGER_META[triggerOf(agentEmployee)] : null
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-[13px] font-semibold">Interviews</p>
        <Button size="xs" variant="outline" onClick={onNew}>Neues Interview</Button>
      </div>
      <div className="max-h-40 overflow-y-auto border-b border-border p-1.5 scrollbar-thin">
        {interviews.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => onSelect(i.id)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
              i.id === interview.id ? 'bg-brand-50' : 'hover:bg-slate-50',
            )}
          >
            <span className={cn('size-1.5 shrink-0 rounded-full', i.status === 'aktiv' ? 'bg-brand' : 'bg-success')} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium">{i.expert.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{i.title}</span>
            </span>
            <span className="text-[10.5px] text-slate-400">{formatRelative(i.updatedAt)}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <PanelSection title="Expertenprofil" icon={ShieldCheck}>
          <div className="flex items-center gap-3">
            <Avatar initials={interview.expert.initials} className="size-10 text-[13px]" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold">{interview.expert.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">{interview.expert.role}</p>
            </div>
          </div>
          <dl className="mt-3 space-y-1.5 text-[12px]">
            <div className="flex justify-between"><dt className="text-muted-foreground">Abteilung</dt><dd className="font-medium">{interview.expert.department}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Betriebszugehörigkeit</dt><dd className="font-medium">{interview.expert.yearsOfService} Jahre</dd></div>
            {interview.expert.retirement && (
              <div className="flex justify-between"><dt className="text-muted-foreground">Stichtag</dt><dd className="font-medium">{formatDate(interview.expert.retirement)}</dd></div>
            )}
          </dl>
          {months <= 12 && months >= 0 && (
            <p className="mt-3 flex items-center gap-1.5 rounded-md bg-danger/[0.06] px-2.5 py-1.5 text-[11.5px] font-medium text-danger">
              <CalendarClock className="size-3.5" /> Wissenstransfer kritisch: noch {months} Monate
            </p>
          )}
        </PanelSection>

        <PanelSection title="Interview" icon={FileText}>
          <p className="text-[13px] font-medium">{interview.title}</p>
          {agentMeta && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 ring-1 ring-black/[0.04]">
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white', agentMeta.tone)}>
                <agentMeta.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold">{agentMeta.agent}</span>
                <span className="block truncate text-[11.5px] text-muted-foreground">Anlass: {agentMeta.label}</span>
              </span>
            </div>
          )}
          {interview.linkedDocumentName && <p className="mt-1 truncate text-[12px] text-muted-foreground">Quelle: {interview.linkedDocumentName}</p>}
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={interview.status === 'aktiv' ? 'brand' : 'success'}>{interview.status === 'aktiv' ? 'Aktiv' : 'Abgeschlossen'}</Badge>
            <span className="text-[11.5px] text-muted-foreground">
              {interview.savedAt ? `Gespeichert ${formatRelative(interview.savedAt)}` : 'Noch nicht gespeichert'}
            </span>
          </div>
        </PanelSection>

        <PanelSection title="Fortschritt" icon={ListChecks}>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{doneTopics} von {interview.topics.length} Themen</span>
            <span className="font-semibold tabular">{Math.round((doneTopics / interview.topics.length) * 100)} %</span>
          </div>
          <Progress value={(doneTopics / interview.topics.length) * 100} className="mt-2" label="Interviewfortschritt" />
          <ul className="mt-3 space-y-1.5">
            {interview.topics.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-[12.5px]">
                {t.done ? <CircleCheck className="size-3.5 text-success" /> : <Circle className="size-3.5 text-slate-300" />}
                <span className={t.done ? 'text-muted-foreground' : 'text-foreground'}>{t.label}</span>
              </li>
            ))}
          </ul>
        </PanelSection>
      </div>
    </Card>
  )
}

export function InsightsPanel({ interview, onValidate }: { interview: ExpertInterview; onValidate: (id: string) => void }) {
  const { state } = useApp()
  const completeness = interviewCompleteness(interview)
  const openQuestions = [...(interview.pendingQuestion ? [interview.pendingQuestion] : []), ...interview.followUps]
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-4 border-b border-border px-4 py-4">
        <ProgressRing value={completeness} size={60} stroke={5} colorClassName={completeness >= 80 ? 'text-success' : 'text-brand'}>
          <span className="text-[13px] font-semibold tabular">{completeness}%</span>
        </ProgressRing>
        <div>
          <p className="text-[13px] font-semibold">Wissensvollständigkeit</p>
          <p className="text-[12px] text-muted-foreground">
            {interview.missingInfo.filter((m) => m.resolved).length}/{interview.missingInfo.length} Lücken geschlossen ·{' '}
            {interview.extracted.filter((e) => e.status === 'validiert').length}/{interview.extracted.filter((e) => e.status !== 'abgelehnt').length} validiert
            {interview.extracted.some((e) => e.status === 'pruefung') && (
              <span className="text-danger"> · {interview.extracted.filter((e) => e.status === 'pruefung').length} in Prüfung</span>
            )}
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <PanelSection title="Extrahiertes Wissen" icon={Lightbulb} count={interview.extracted.length}>
          {interview.extracted.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">Antworten der Expertin bzw. des Experten werden hier automatisch strukturiert.</p>
          ) : (
            <ul className="space-y-2">
              {interview.extracted.map((e) => {
                const review = state.reviews.find((r) => r.id === e.reviewId)
                const pm = e.plausibility ? plausibilityMeta(e.plausibility.score) : null
                return (
                  <li
                    key={e.id}
                    className={cn(
                      'rounded-md border p-2.5',
                      e.status === 'validiert' && 'border-success/25 bg-success/[0.04]',
                      e.status === 'pruefung' && 'border-danger/25 bg-danger/[0.04]',
                      e.status === 'abgelehnt' && 'border-dashed border-slate-300 bg-slate-50',
                      e.status === 'neu' && 'border-border bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-brand-700">{e.topic}</span>
                      {e.plausibility && pm && (
                        <span
                          title={e.plausibility.reasons.join(' · ')}
                          className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-semibold tabular', pm.chip)}
                        >
                          <Scale className="size-3" /> {e.plausibility.score} %
                        </span>
                      )}
                    </div>
                    <p className={cn('mt-1 text-[12.5px] leading-relaxed', e.status === 'abgelehnt' ? 'text-slate-400 line-through' : 'text-foreground')}>
                      {e.statement}
                    </p>
                    {e.plausibility && e.status !== 'validiert' && e.plausibility.score < 80 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {e.plausibility.reasons.map((r) => (
                          <li key={r} className="flex gap-1.5 text-[11.5px] leading-snug text-muted-foreground">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-400" /> {r}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2">
                      {e.status === 'validiert' && (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-success">
                          <CircleCheck className="size-3.5" />
                          {review ? `${review.status === 'korrigiert' ? 'Korrigiert' : 'Bestätigt'} von ${review.decidedBy}` : 'Validiert'}
                        </span>
                      )}
                      {e.status === 'pruefung' && (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-danger">
                          <ShieldAlert className="size-3.5" /> Vier-Augen-Prüfung bei {review?.reviewerName ?? 'Führungskraft'}
                        </span>
                      )}
                      {e.status === 'abgelehnt' && (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-500">
                          <CircleX className="size-3.5" /> Abgelehnt von {review?.decidedBy ?? 'Führungskraft'} – fließt nicht ins Wissen ein
                        </span>
                      )}
                      {e.status === 'neu' && (
                        <Button size="xs" variant="outline" onClick={() => onValidate(e.id)} disabled={interview.status !== 'aktiv'}>
                          Validieren
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </PanelSection>

        <PanelSection title="Erkannte Widersprüche" icon={TriangleAlert} count={interview.contradictions.length}>
          {interview.contradictions.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">Keine Widersprüche erkannt.</p>
          ) : (
            <ul className="space-y-2">
              {interview.contradictions.map((c) => (
                <li
                  key={c.id}
                  className={cn(
                    'rounded-md border p-2.5 text-[12.5px] leading-relaxed',
                    c.resolved ? 'border-success/25 bg-success/[0.04]' : 'border-danger/25 bg-danger/[0.05]',
                  )}
                >
                  <span className={cn('mb-1 flex items-center gap-1 text-[11px] font-semibold', c.resolved ? 'text-success' : 'text-danger')}>
                    {c.resolved ? <CircleCheck className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                    {c.resolved ? 'Geklärt' : 'Widerspruch – Klärung erforderlich'}
                  </span>
                  {c.text}
                </li>
              ))}
            </ul>
          )}
        </PanelSection>

        <PanelSection title="Offene Fragen" icon={CircleHelp} count={openQuestions.length}>
          {openQuestions.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">Keine offenen Fragen.</p>
          ) : (
            <ul className="space-y-1.5">
              {openQuestions.map((q) => (
                <li key={q} className="flex gap-2 text-[12.5px] leading-relaxed">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {q}
                </li>
              ))}
            </ul>
          )}
        </PanelSection>

        <PanelSection title="Fehlende Informationen" icon={ListChecks} count={interview.missingInfo.filter((m) => !m.resolved).length}>
          <ul className="space-y-1.5">
            {interview.missingInfo.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-[12.5px]">
                {m.resolved ? <CircleCheck className="size-3.5 shrink-0 text-success" /> : <Circle className="size-3.5 shrink-0 text-warning" />}
                <span className={m.resolved ? 'text-muted-foreground line-through decoration-slate-300' : 'text-foreground'}>{m.label}</span>
              </li>
            ))}
          </ul>
        </PanelSection>
      </div>
    </Card>
  )
}
