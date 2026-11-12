import type * as React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Circle,
  CircleCheck,
  FileQuestion,
  FileSearch,
  Hash,
  LoaderCircle,
  MessagesSquare,
  RotateCcw,
  ScanText,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { Document } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState, KeyValue, Skeleton } from '@/components/ui/misc'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { DocumentStatusBadge, TYPE_COLOR, TYPE_ICON } from '@/components/documents/DocumentLibrary'
import { useApp } from '@/context/AppContext'
import { ANALYSIS_STEPS } from '@/services/ai-service'
import { validityRange } from '@/lib/validity'
import { cn, formatDate, formatDateLong, formatFileSize } from '@/lib/utils'

function AnalysisProgress({ doc }: { doc: Document }) {
  const uploading = doc.status === 'uploading'
  const overall = uploading ? doc.progress * 0.1 : 10 + (doc.currentStep / ANALYSIS_STEPS.length) * 90
  return (
    <div className="p-5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-foreground">{uploading ? `Upload läuft … ${doc.progress} %` : 'KI-Analyse läuft'}</span>
        <span className="font-medium text-muted-foreground tabular">{Math.round(overall)} %</span>
      </div>
      <Progress value={overall} className="mt-2 h-2" label="Gesamtfortschritt" />
      <ol className="mt-5 space-y-1">
        {ANALYSIS_STEPS.map((step, i) => {
          const state = uploading ? 'pending' : i < doc.currentStep ? 'done' : i === doc.currentStep ? 'active' : 'pending'
          return (
            <motion.li
              key={step}
              initial={false}
              animate={{ opacity: state === 'pending' ? 0.55 : 1 }}
              className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-[13px]', state === 'active' && 'bg-brand-50')}
            >
              {state === 'done' && <CircleCheck className="size-4 text-success" />}
              {state === 'active' && <LoaderCircle className="size-4 animate-spin text-brand" />}
              {state === 'pending' && <Circle className="size-4 text-slate-300" />}
              <span className={cn('flex-1', state === 'active' ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {i + 1}. {step}
              </span>
              {state === 'done' && <span className="text-[11px] text-slate-400">fertig</span>}
            </motion.li>
          )
        })}
      </ol>
      <div className="mt-5 space-y-2 rounded-md border border-dashed border-border p-4">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children, className }: { icon: React.ElementType; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-border px-5 py-4', className)}>
      <h4 className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="size-3.5" /> {title}
      </h4>
      {children}
    </section>
  )
}

function AnalysisResult({ doc }: { doc: Document }) {
  const a = doc.analysis
  const navigate = useNavigate()
  const { importDocument } = useApp()
  const { toast } = useToast()
  if (!a) return null
  const imported = doc.linkedArticleIds.length > 0

  const handleImport = () => {
    const id = importDocument(doc.id)
    if (!id) {
      toast({ title: 'Übernahme nicht möglich', description: 'Das Dokument enthält keine Analyse.', variant: 'error' })
      return
    }
    toast({
      title: 'Wissen übernommen',
      description: `„${a.suggestedTitle}“ ist jetzt in der Knowledge Base.`,
      variant: 'success',
      action: { label: 'Artikel öffnen', onClick: () => navigate(`/knowledge-base/${id}`) },
    })
  }

  return (
    <div>
      <Section icon={Sparkles} title="Executive Summary" className="border-t-0">
        <p className="text-[13.5px] leading-relaxed text-foreground">{a.summary}</p>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>KI-Konfidenz</span>
          <Progress value={a.confidence * 100} className="h-1 w-24" label="KI-Konfidenz" />
          <span className="font-semibold text-foreground tabular">{Math.round(a.confidence * 100)} %</span>
        </div>
      </Section>

      <Section icon={Hash} title="Erkannte Themen">
        <div className="flex flex-wrap gap-1.5">
          {a.topics.map((t) => (
            <Badge key={t} variant="brand">{t}</Badge>
          ))}
        </div>
      </Section>

      <div className="grid md:grid-cols-2">
        <Section icon={BookOpenCheck} title="Fachbegriffe" className="md:border-r">
          <dl className="space-y-2.5">
            {a.keyConcepts.map((k) => (
              <div key={k.term}>
                <dt className="text-[13px] font-semibold text-foreground">{k.term}</dt>
                <dd className="text-[12.5px] leading-relaxed text-muted-foreground">{k.definition}</dd>
              </div>
            ))}
          </dl>
        </Section>
        <Section icon={CalendarClock} title="Wichtige Daten">
          {a.importantDates.length ? (
            <ol className="relative space-y-3 border-l border-border pl-4">
              {a.importantDates.map((d) => (
                <li key={`${d.date}-${d.label}`} className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-white bg-navy-800" />
                  <p className="text-[12px] font-semibold text-foreground tabular">{formatDate(d.date)}</p>
                  <p className="text-[12.5px] text-muted-foreground">{d.label}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">Keine Datumsangaben erkannt.</p>
          )}
        </Section>
      </div>

      <Section icon={CalendarClock} title="Gültigkeit">
        <div className={cn('rounded-md border p-3.5', a.validity.status === 'historisch' ? 'border-dashed border-slate-300 bg-slate-50' : 'border-border')}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={a.validity.status} />
            <span className="text-[13px] font-medium text-foreground tabular">{validityRange(a.validity.validFrom, a.validity.validUntil)}</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{a.validity.note}</p>
        </div>
      </Section>

      <Section icon={TriangleAlert} title={`Mögliche Widersprüche (${a.contradictions.length})`}>
        {a.contradictions.length ? (
          <ul className="space-y-2">
            {a.contradictions.map((c) => (
              <li
                key={c.id}
                className={cn(
                  'flex gap-2.5 rounded-md border p-3 text-[12.5px] leading-relaxed',
                  c.severity === 'hoch' ? 'border-danger/20 bg-danger/[0.04]' : 'border-warning/25 bg-warning/[0.06]',
                )}
              >
                <TriangleAlert className={cn('mt-0.5 size-4 shrink-0', c.severity === 'hoch' ? 'text-danger' : 'text-warning')} />
                <span>
                  <span className="font-semibold">{c.severity === 'hoch' ? 'Hohe Relevanz: ' : 'Mittlere Relevanz: '}</span>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-muted-foreground">Keine Widersprüche zu bestehendem Wissen erkannt.</p>
        )}
      </Section>

      <Section icon={FileQuestion} title={`Fehlendes Wissen (${a.missingKnowledge.length})`}>
        {a.missingKnowledge.length ? (
          <ul className="space-y-1.5">
            {a.missingKnowledge.map((m) => (
              <li key={m} className="flex items-start gap-2 text-[13px]">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                {m}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-muted-foreground">Keine Wissenslücken erkannt.</p>
        )}
      </Section>

      <Section icon={ScanText} title="Quelle">
        <dl className="divide-y divide-border">
          <KeyValue label="Autor / Herausgeber">{a.source.author}</KeyValue>
          <KeyValue label="Abteilung">{a.source.department}</KeyValue>
          <KeyValue label="Referenz">{a.source.reference}</KeyValue>
          <KeyValue label="Umfang">{a.source.pages} Seiten</KeyValue>
          <KeyValue label="Klassifizierung">{a.source.classification}</KeyValue>
        </dl>
      </Section>

      <div className="flex flex-col gap-2 border-t border-border bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end">
        {a.missingKnowledge.length > 0 && (
          <Button variant="outline" onClick={() => navigate('/expert-knowledge', { state: { startInterview: true, documentId: doc.id } })}>
            <MessagesSquare /> Lücken im Experteninterview klären
          </Button>
        )}
        {imported ? (
          <Button variant="brand" onClick={() => navigate(`/knowledge-base/${doc.linkedArticleIds[0]}`)}>
            In Knowledge Base ansehen <ArrowRight />
          </Button>
        ) : (
          <Button variant="brand" onClick={handleImport}>
            <BookOpenCheck /> Wissen in Knowledge Base übernehmen
          </Button>
        )}
      </div>
    </div>
  )
}

function DocumentPreview({ doc }: { doc: Document }) {
  return (
    <div className="bg-slate-100/70 p-5">
      <div className="mx-auto max-w-md rounded-sm bg-white p-7 shadow-card ring-1 ring-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-[10px] font-bold tracking-[0.2em] text-navy-800">INTERNES DOKUMENT · DEMO</span>
          <span className="text-[10px] text-slate-400">Seite 1 / {doc.analysis?.source.pages ?? 1}</span>
        </div>
        <h4 className="mt-4 text-sm font-semibold text-foreground">{doc.analysis?.suggestedTitle ?? doc.name}</h4>
        {doc.previewText ? (
          <pre className="mt-3 whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-slate-600">{doc.previewText}</pre>
        ) : (
          <>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-600">{doc.analysis?.summary ?? 'Vorschau wird nach der Analyse erstellt.'}</p>
            <div className="mt-4 space-y-2">
              {[92, 100, 84, 96, 70, 88, 60].map((w, i) => (
                <div key={i} className="h-2 rounded bg-slate-100" style={{ width: `${w}%` }} />
              ))}
            </div>
          </>
        )}
      </div>
      <p className="mt-3 text-center text-[11.5px] text-muted-foreground">Vereinfachte Vorschau (Demo)</p>
    </div>
  )
}

export function DocumentDetail({ document: doc, onReanalyze }: { document: Document | null; onReanalyze: (doc: Document) => void }) {
  const [tab, setTab] = useState('analyse')

  if (!doc) {
    return (
      <Card>
        <EmptyState icon={FileSearch} title="Kein Dokument ausgewählt" description="Wählen Sie ein Dokument aus der Bibliothek oder laden Sie ein neues hoch." />
      </Card>
    )
  }

  const Icon = TYPE_ICON[doc.type]
  const busy = doc.status === 'uploading' || doc.status === 'processing'

  return (
    <Card className="min-w-0 overflow-hidden xl:sticky xl:top-4 xl:self-start">
      <div className="flex items-start gap-3 px-5 py-4">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-md', TYPE_COLOR[doc.type])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-foreground" title={doc.name}>{doc.name}</p>
          <p className="text-[12px] text-muted-foreground">
            {doc.type} · {formatFileSize(doc.sizeKb)} · {doc.uploadedBy} · {formatDateLong(doc.uploadedAt)}
          </p>
        </div>
        <DocumentStatusBadge doc={doc} />
      </div>

      {busy && <div className="border-t border-border"><AnalysisProgress doc={doc} /></div>}

      {doc.status === 'error' && (
        <div className="border-t border-border p-5">
          <div className="flex items-start gap-3 rounded-md border border-danger/20 bg-danger/[0.04] p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold">Verarbeitung fehlgeschlagen</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{doc.error ?? 'Unbekannter Fehler'}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => onReanalyze(doc)}>
                <RotateCcw /> Erneut analysieren
              </Button>
            </div>
          </div>
        </div>
      )}

      {doc.analysis && !busy && (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="border-t border-border px-5 py-2.5">
            <TabsList>
              <TabsTrigger value="analyse" icon={Sparkles}>KI-Analyse</TabsTrigger>
              <TabsTrigger value="vorschau" icon={ScanText}>Vorschau</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="analyse" className="border-t border-border">
            <AnalysisResult doc={doc} />
          </TabsContent>
          <TabsContent value="vorschau" className="border-t border-border">
            <DocumentPreview doc={doc} />
          </TabsContent>
        </Tabs>
      )}
    </Card>
  )
}
