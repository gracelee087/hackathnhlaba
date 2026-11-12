import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Archive, CalendarRange, MessagesSquare, FileText, UserRound } from 'lucide-react'
import type { KnowledgeArticle } from '@/types'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, VerificationBadge } from '@/components/ui/status-badge'
import { STATUS_META, isHistoric, validityRange } from '@/lib/validity'
import { cn, formatDate } from '@/lib/utils'

const TIMELINE_START = 1990

function yearFraction(iso: string) {
  const d = new Date(iso)
  return d.getFullYear() + d.getMonth() / 12
}

/** Visualisiert Gültigkeitszeiträume – historisch vs. aktuell auf einen Blick. */
export function ValidityTimeline({ articles, highlightId }: { articles: KnowledgeArticle[]; highlightId?: string }) {
  const end = new Date().getFullYear() + 2
  const span = end - TIMELINE_START
  const ticks = [1990, 2000, 2010, 2020, end - 2]
  return (
    <div>
      <div className="relative h-5 text-[10.5px] text-slate-400">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 tabular" style={{ left: `${((t - TIMELINE_START) / span) * 100}%` }}>
            {t === end - 2 ? 'heute' : t}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {articles.map((a) => {
          const from = Math.max(TIMELINE_START, yearFraction(a.validFrom))
          const to = a.validUntil ? yearFraction(a.validUntil) : end - 2 + new Date().getMonth() / 12
          const left = ((from - TIMELINE_START) / span) * 100
          const width = Math.max(1.5, ((to - from) / span) * 100)
          const historic = isHistoric(a.status)
          return (
            <div key={a.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
                <span className={cn('truncate', a.id === highlightId ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{a.title}</span>
                <span className="shrink-0 text-[11px] text-slate-400 tabular">{validityRange(a.validFrom, a.validUntil)}</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={cn(
                    'absolute inset-y-0 rounded-full',
                    a.status === 'aktuell' && 'bg-success',
                    a.status === 'pruefung' && 'bg-warning',
                    a.status === 'historisch' && 'bg-[repeating-linear-gradient(135deg,#94a3b8_0_4px,#cbd5e1_4px_8px)]',
                    a.status === 'veraltet' && 'bg-danger/70',
                    historic && 'opacity-90',
                  )}
                  style={{ left: `${left}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {(['aktuell', 'pruefung', 'historisch', 'veraltet'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', STATUS_META[s].dot)} /> {STATUS_META[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function OriginIcon({ origin }: { origin: KnowledgeArticle['origin'] }) {
  const Icon = origin === 'interview' ? MessagesSquare : origin === 'dokument' ? FileText : UserRound
  const label = origin === 'interview' ? 'Experteninterview' : origin === 'dokument' ? 'Dokumentanalyse' : 'Manuell'
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground" title={`Quelle: ${label}`}>
      <Icon className="size-3.5" /> {label}
    </span>
  )
}

export function ArticleCard({ article, index }: { article: KnowledgeArticle; index: number }) {
  const historic = isHistoric(article.status)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025 }}>
      <Link
        to={`/knowledge-base/${article.id}`}
        className={cn(
          'group flex h-full flex-col rounded-lg border bg-white p-4 shadow-card transition-all hover:-translate-y-px hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
          article.status === 'historisch' && 'border-dashed border-slate-300 bg-slate-50/80',
          article.status === 'veraltet' && 'border-l-[3px] border-l-danger/60 bg-slate-50/80',
          article.status === 'pruefung' && 'border-l-[3px] border-l-warning',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{article.category}</Badge>
            {article.tags.includes('neu') && <Badge className="border-transparent bg-brand text-white">Neu</Badge>}
          </span>
          <StatusBadge status={article.status} />
        </div>
        <h3
          className={cn(
            'mt-3 text-[14.5px] font-semibold leading-snug text-foreground group-hover:text-brand-700',
            article.status === 'veraltet' && 'text-slate-500 line-through decoration-slate-400',
          )}
        >
          {article.title}
        </h3>
        <p className={cn('mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed', historic ? 'text-slate-500' : 'text-muted-foreground')}>{article.description}</p>
        {historic && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500">
            <Archive className="size-3.5" /> {article.status === 'historisch' ? 'Historische Regelung – nur für Altfälle' : 'Ersetzt – nicht mehr anwenden'}
          </p>
        )}
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <CalendarRange className="size-3.5" />
            <span className="tabular">{validityRange(article.validFrom, article.validUntil)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <span className="truncate text-[11.5px] text-muted-foreground">
              {article.expert} · {formatDate(article.updatedAt)}
            </span>
            <VerificationBadge value={article.verification} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
