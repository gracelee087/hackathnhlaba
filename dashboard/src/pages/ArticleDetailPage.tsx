import { Link, useNavigate, useParams } from 'react-router-dom'
import { Archive, ArrowLeft, BadgeCheck, Bot, FileText, GitCommitHorizontal, Sparkles, TriangleAlert, SearchX, CalendarRange } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, KeyValue } from '@/components/ui/misc'
import { StatusBadge, VerificationBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { OriginIcon, ValidityTimeline } from '@/components/knowledge/KnowledgeComponents'
import { useApp } from '@/context/AppContext'
import { STATUS_META, isHistoric } from '@/lib/validity'
import { cn, formatDate } from '@/lib/utils'

export default function ArticleDetailPage() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, verifyArticle } = useApp()
  const article = state.articles.find((a) => a.id === articleId)

  if (!article) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="Artikel nicht gefunden"
          description="Der Wissensartikel existiert nicht oder wurde entfernt."
          action={<Button variant="outline" onClick={() => navigate('/knowledge-base')}><ArrowLeft /> Zur Knowledge Base</Button>}
        />
      </Card>
    )
  }

  const successor = article.supersededBy ? state.articles.find((a) => a.id === article.supersededBy) : undefined
  const predecessors = state.articles.filter((a) => a.supersededBy === article.id)
  const chain = [...predecessors, article, ...(successor ? [successor] : [])]
  const related = state.articles
    .filter((a) => a.id !== article.id && !chain.includes(a) && (a.category === article.category || a.tags.some((t) => article.tags.includes(t))))
    .slice(0, 4)
  const historic = isHistoric(article.status)
  const canVerify = article.verification !== 'verifiziert' && !historic

  return (
    <div className="space-y-8">
      <Link to="/knowledge-base" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Zurück zur Knowledge Base
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={article.status} />
            <Badge variant="outline">{article.category}</Badge>
            {article.tags.includes('neu') && <Badge className="border-transparent bg-brand text-white">Neu</Badge>}
            <OriginIcon origin={article.origin} />
          </div>
          <h1 className={cn('mt-3 text-2xl font-semibold tracking-tight', article.status === 'veraltet' && 'text-slate-500 line-through decoration-slate-400')}>
            {article.title}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">{article.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/assistant', { state: { question: `Was muss ich zu „${article.title}“ wissen?` } })}>
            <Bot /> Assistent fragen
          </Button>
          <Button variant="outline" onClick={() => navigate('/content-studio', { state: { articleIds: [article.id] } })}>
            <Sparkles /> Lernmodul erstellen
          </Button>
          {canVerify && (
            <Button
              onClick={() => {
                verifyArticle(article.id)
                toast({ title: 'Artikel verifiziert', description: 'Status auf „Aktuell“ gesetzt, neue Version angelegt.', variant: 'success' })
              }}
            >
              <BadgeCheck /> Fachlich freigeben
            </Button>
          )}
        </div>
      </div>

      {historic && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4',
            article.status === 'veraltet' ? 'border-danger/25 bg-danger/[0.04]' : 'border-dashed border-slate-300 bg-slate-50',
          )}
        >
          {article.status === 'veraltet' ? <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" /> : <Archive className="mt-0.5 size-5 shrink-0 text-slate-500" />}
          <div className="text-[13.5px]">
            <p className="font-semibold">{article.status === 'veraltet' ? 'Veraltete Regelung – nicht mehr anwenden' : 'Historische Regelung'}</p>
            <p className="mt-0.5 text-muted-foreground">
              Gültig vom {formatDate(article.validFrom)} bis {formatDate(article.validUntil)}. {STATUS_META[article.status].hint}
              {successor && (
                <>
                  {' '}Aktuell maßgeblich:{' '}
                  <Link to={`/knowledge-base/${successor.id}`} className="font-semibold text-brand hover:underline">
                    {successor.title}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      )}
      {article.status === 'pruefung' && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-4 text-[13.5px]">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">Prüfung erforderlich</p>
            <p className="mt-0.5 text-muted-foreground">Dieser Inhalt wurde noch nicht vollständig fachlich freigegeben. Bitte vor Verwendung in der Beratung bestätigen.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <Card>
            <SectionHeader title="Inhalt" description={`Version ${article.versions[0]?.version ?? '1.0'} · aktualisiert am ${formatDate(article.updatedAt)}`} />
            <div className="space-y-3 px-5 pb-5 pt-4">
              {article.content.map((p, i) => (
                <p key={i} className={cn('text-[14px] leading-relaxed', historic ? 'text-slate-500' : 'text-foreground')}>{p}</p>
              ))}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {article.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader icon={CalendarRange} title="Gültigkeitsverlauf" description="Historische und aktuell gültige Fassungen im Vergleich" />
            <div className="px-5 pb-5 pt-4">
              <ValidityTimeline articles={chain} highlightId={article.id} />
            </div>
          </Card>

          {related.length > 0 && (
            <Card>
              <SectionHeader title="Verwandte Wissensartikel" />
              <ul className="grid gap-2 p-5 pt-4 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link to={`/knowledge-base/${r.id}`} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-slate-50">
                      <span className="text-[13px] font-medium">{r.title}</span>
                      <StatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card>
            <SectionHeader title="Metadaten" />
            <dl className="divide-y divide-border px-5 pb-3 pt-2">
              <KeyValue label="Kategorie">{article.category}</KeyValue>
              <KeyValue label="Abteilung">{article.department}</KeyValue>
              <KeyValue label="Experte / Expertin">{article.expert}</KeyValue>
              <KeyValue label="Erstellt">{formatDate(article.createdAt)}</KeyValue>
              <KeyValue label="Zuletzt aktualisiert">{formatDate(article.updatedAt)}</KeyValue>
              <KeyValue label="Gültig ab">{formatDate(article.validFrom)}</KeyValue>
              <KeyValue label="Gültig bis">{formatDate(article.validUntil)}</KeyValue>
              <KeyValue label="Verifizierung"><VerificationBadge value={article.verification} /></KeyValue>
            </dl>
          </Card>

          <Card>
            <SectionHeader title="Quelldokumente" />
            <ul className="space-y-1.5 p-5 pt-3">
              {article.sourceDocuments.map((d) => (
                <li key={d} className="flex items-center gap-2 text-[13px]">
                  <FileText className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate" title={d}>{d}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader title="Versionshistorie" />
            <ol className="relative space-y-4 p-5 pt-4">
              {article.versions.map((v, i) => (
                <li key={`${v.version}-${i}`} className="relative flex gap-3">
                  <span className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full', i === 0 ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-500')}>
                    <GitCommitHorizontal className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold">
                      Version {v.version} {i === 0 && <span className="ml-1 text-[11px] font-medium text-success">aktuell</span>}
                    </p>
                    <p className="text-[12.5px] text-muted-foreground">{v.change}</p>
                    <p className="text-[11.5px] text-slate-400">{v.author} · {formatDate(v.date)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}
