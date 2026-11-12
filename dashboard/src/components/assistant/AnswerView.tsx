import { Link } from 'react-router-dom'
import { BookOpen, FileText, Gauge, TriangleAlert } from 'lucide-react'
import type { AssistantAnswer } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { DemoBadge } from '@/components/ui/misc'
import { Progress } from '@/components/ui/progress'
import { validityRange } from '@/lib/validity'
import { cn } from '@/lib/utils'

export function confidenceMeta(value: number) {
  if (value >= 80) return { label: 'Hoch', className: 'text-success', bar: 'bg-success' }
  if (value >= 55) return { label: 'Mittel', className: 'text-warning', bar: 'bg-warning' }
  return { label: 'Niedrig', className: 'text-danger', bar: 'bg-danger' }
}

export function AnswerView({ answer, selected, onSelect }: { answer: AssistantAnswer; selected?: boolean; onSelect?: () => void }) {
  const conf = confidenceMeta(answer.confidence)
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-4 shadow-card transition-colors',
        selected ? 'border-brand/40 ring-1 ring-brand/20' : 'border-border',
        onSelect && 'cursor-pointer hover:border-brand/30',
      )}
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DemoBadge label="Simulierte Demo-Antwort" />
        <span className={cn('inline-flex items-center gap-1.5 text-[12px] font-medium', conf.className)}>
          <Gauge className="size-3.5" /> Konfidenz {conf.label} · {answer.confidence} %
        </span>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-foreground">{answer.summary}</p>

      {answer.warnings.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-md border border-warning/30 bg-warning/[0.06] p-3">
          {answer.warnings.map((w) => (
            <p key={w} className="flex gap-2 text-[12.5px] leading-relaxed text-foreground">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
              {w}
            </p>
          ))}
        </div>
      )}

      {answer.points.length > 0 && (
        <div className="mt-4">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Wichtige Punkte</p>
          <ol className="mt-2 space-y-2.5">
            {answer.points.map((p, i) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-navy-50 text-[11px] font-semibold text-navy-800">{i + 1}</span>
                <div>
                  <p className="text-[13px] font-semibold">{p.title}</p>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {answer.sources.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {answer.sources.map((s, i) => (
            <Link
              key={s.articleId}
              to={`/knowledge-base/${s.articleId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-slate-50 px-2 py-1 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-brand/40 hover:text-brand-700"
            >
              <span className="text-slate-400">[{i + 1}]</span> {s.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function SourcePanel({ answer }: { answer?: AssistantAnswer }) {
  if (!answer) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[13px] text-muted-foreground">
        <BookOpen className="mb-3 size-6 text-slate-300" />
        Quellen, Gültigkeiten und Konfidenz der Antwort erscheinen hier.
      </div>
    )
  }
  const conf = confidenceMeta(answer.confidence)
  return (
    <div className="space-y-5 p-4">
      <section>
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Konfidenz</p>
        <div className="mt-2 flex items-center gap-3">
          <span className={cn('text-2xl font-semibold tabular', conf.className)}>{answer.confidence} %</span>
          <div className="flex-1">
            <Progress value={answer.confidence} indicatorClassName={conf.bar} label="Konfidenz" />
            <p className="mt-1 text-[11.5px] text-muted-foreground">Basierend auf Quellenabdeckung und Gültigkeitsstatus</p>
          </div>
        </div>
      </section>

      <section>
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Wissensartikel ({answer.sources.length})</p>
        {answer.sources.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-muted-foreground">Keine passenden Artikel gefunden.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {answer.sources.map((s, i) => (
              <li key={s.articleId}>
                <Link to={`/knowledge-base/${s.articleId}`} className={cn('block rounded-md border p-3 transition-colors hover:bg-slate-50', s.status === 'historisch' || s.status === 'veraltet' ? 'border-dashed border-slate-300 bg-slate-50/60' : 'border-border')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-semibold leading-snug"><span className="text-slate-400">[{i + 1}]</span> {s.title}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-muted-foreground tabular">Gültig: {validityRange(s.validFrom, s.validUntil)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={s.relevance} className="h-1" label="Relevanz" />
                    <span className="shrink-0 whitespace-nowrap text-[10.5px] text-slate-400 tabular">{s.relevance} %</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {answer.documents.length > 0 && (
        <section>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Dokumentreferenzen</p>
          <ul className="mt-2 space-y-1.5">
            {answer.documents.map((d) => (
              <li key={d} className="flex items-center gap-2 text-[12.5px]">
                <FileText className="size-3.5 shrink-0 text-slate-400" />
                <Link to="/documents" className="truncate hover:text-brand hover:underline" title={d}>{d}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
