import type * as React from 'react'
import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, FileType, Presentation, SearchX } from 'lucide-react'
import type { Document, DocumentStatus, DocumentType } from '@/types'
import { Card, SectionHeader } from '@/components/ui/card'
import { NativeSelect, SearchInput } from '@/components/ui/inputs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/misc'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { cn, formatDate, formatFileSize } from '@/lib/utils'

export const TYPE_ICON: Record<DocumentType, React.ElementType> = {
  PDF: FileText,
  DOCX: FileType,
  PPTX: Presentation,
  TXT: FileSpreadsheet,
}

export const TYPE_COLOR: Record<DocumentType, string> = {
  PDF: 'text-danger bg-danger/[0.07]',
  DOCX: 'text-brand bg-brand-50',
  PPTX: 'text-warning bg-warning/10',
  TXT: 'text-slate-600 bg-slate-100',
}

export function DocumentStatusBadge({ doc }: { doc: Document }) {
  const map: Record<DocumentStatus, { label: string; variant: 'brand' | 'success' | 'secondary' | 'danger' | 'outline' }> = {
    uploading: { label: 'Upload', variant: 'outline' },
    processing: { label: 'KI-Analyse', variant: 'brand' },
    analyzed: { label: 'Analysiert', variant: 'secondary' },
    imported: { label: 'In Knowledge Base', variant: 'success' },
    error: { label: 'Fehler', variant: 'danger' },
  }
  const m = map[doc.status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function DocumentLibrary({
  documents,
  selectedId,
  onSelect,
}: {
  documents: Document[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'alle' | DocumentType>('alle')
  const [status, setStatus] = useState<'alle' | DocumentStatus>('alle')

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          (type === 'alle' || d.type === type) &&
          (status === 'alle' || d.status === status) &&
          `${d.name} ${d.department} ${d.analysis?.topics.join(' ') ?? ''}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [documents, query, type, status],
  )

  return (
    <Card className="min-w-0">
      <SectionHeader title="Dokumentenbibliothek" description={`${documents.length} Dokumente · ${filtered.length} angezeigt`} />
      <div className="flex flex-col gap-2 px-5 pt-4 sm:flex-row">
        <SearchInput wrapperClassName="flex-1" placeholder="Dokumente oder Themen suchen…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Dokumente durchsuchen" />
        <NativeSelect value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Dateityp filtern" className="sm:w-32">
          <option value="alle">Alle Typen</option>
          {(['PDF', 'DOCX', 'PPTX', 'TXT'] as DocumentType[]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status filtern" className="sm:w-44">
          <option value="alle">Alle Status</option>
          <option value="processing">In Analyse</option>
          <option value="analyzed">Analysiert</option>
          <option value="imported">In Knowledge Base</option>
          <option value="error">Fehler</option>
        </NativeSelect>
      </div>
      <div className="mt-4 border-t border-border">
        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title="Keine Dokumente gefunden" description="Passen Sie Suche oder Filter an." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Dokument</TH>
                <TH className="hidden md:table-cell">Abteilung</TH>
                <TH className="hidden sm:table-cell">Hochgeladen</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((d) => {
                const Icon = TYPE_ICON[d.type]
                const busy = d.status === 'uploading' || d.status === 'processing'
                return (
                  <TR
                    key={d.id}
                    onClick={() => onSelect(d.id)}
                    className={cn('cursor-pointer hover:bg-slate-50', selectedId === d.id && 'bg-brand-50/50 hover:bg-brand-50/70')}
                    aria-selected={selectedId === d.id}
                  >
                    <TD className="max-w-[280px]">
                      <div className="flex items-center gap-3">
                        <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', TYPE_COLOR[d.type])}>
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{d.name}</p>
                          <p className="text-[11.5px] text-muted-foreground">{d.type} · {formatFileSize(d.sizeKb)}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="hidden text-muted-foreground md:table-cell">{d.department}</TD>
                    <TD className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">{formatDate(d.uploadedAt)}</TD>
                    <TD className="w-36">
                      {busy ? (
                        <div className="space-y-1">
                          <DocumentStatusBadge doc={d} />
                          <Progress value={d.status === 'uploading' ? d.progress : (d.currentStep / 7) * 100} className="h-1" label="Fortschritt" />
                        </div>
                      ) : (
                        <DocumentStatusBadge doc={d} />
                      )}
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </div>
    </Card>
  )
}
