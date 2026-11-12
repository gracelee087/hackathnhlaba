import { useState } from 'react'
import { Clock, FileSearch, LoaderCircle, ShieldCheck, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/ui/misc'
import { Card, SectionHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadZone } from '@/components/documents/UploadZone'
import { DocumentLibrary } from '@/components/documents/DocumentLibrary'
import { DocumentDetail } from '@/components/documents/DocumentDetail'
import { useApp } from '@/context/AppContext'
import { useDocumentProcessor } from '@/hooks/useDocumentProcessor'
import { useMetrics } from '@/hooks/useMetrics'
import { formatNumber } from '@/lib/utils'

export default function DocumentsPage() {
  const { state } = useApp()
  const metrics = useMetrics()
  const { handleFiles, reanalyze, startDemo } = useDocumentProcessor()
  const [selectedId, setSelectedId] = useState<string | null>(() => state.documents[0]?.id ?? null)
  const selected = state.documents.find((d) => d.id === selectedId) ?? null
  const processing = state.documents.filter((d) => d.status === 'uploading' || d.status === 'processing').length
  const contradictions = state.documents.reduce((s, d) => s + (d.analysis?.contradictions.length ?? 0), 0)

  const onFiles = async (files: File[]) => {
    const ids = await handleFiles(files)
    if (ids[0]) setSelectedId(ids[0])
  }

  const stats = [
    { label: 'In Verarbeitung', value: processing, icon: LoaderCircle, spin: processing > 0 },
    { label: 'Dokumente analysiert', value: formatNumber(metrics.documentsAnalyzed), icon: FileSearch },
    { label: 'Widersprüche erkannt', value: contradictions, icon: TriangleAlert },
    { label: 'Ø Analysezeit', value: '6,4 s', icon: Clock },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Document Intelligence"
        description="Verwandeln Sie vorhandene Dokumente in strukturiertes Unternehmenswissen."
        actions={
          <Button variant="outline" onClick={() => setSelectedId(startDemo())}>
            <FileSearch /> Demo-Dokument analysieren
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <UploadZone className="lg:col-span-2" onFiles={onFiles} onDemo={() => setSelectedId(startDemo())} />
        <Card>
          <SectionHeader title="Verarbeitungsstatus" description="KI-Pipeline in Echtzeit" />
          <div className="grid grid-cols-2 gap-3 p-5 pt-4">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-md border border-border p-3">
                  <Icon className={`size-4 text-navy-800 ${s.spin ? 'animate-spin' : ''}`} />
                  <p className="mt-2 text-lg font-semibold leading-none tabular">{s.value}</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">{s.label}</p>
                </div>
              )
            })}
          </div>
          <div className="mx-5 mb-5 flex items-start gap-2 rounded-md bg-success/[0.07] p-3 text-[12px] leading-relaxed text-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
            Datenschutz, Informationssicherheit und Berechtigungskonzepte werden bei jeder Verarbeitung geprüft.
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <DocumentLibrary documents={state.documents} selectedId={selectedId} onSelect={setSelectedId} />
        <DocumentDetail document={selected} onReanalyze={reanalyze} />
      </div>
    </div>
  )
}
