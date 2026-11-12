import { useRef, useState } from 'react'
import { CloudUpload, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function UploadZone({
  onFiles,
  onDemo,
  className,
}: {
  onFiles: (files: File[]) => void
  onDemo: () => void
  className?: string
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className={cn('p-1.5', className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Dokumente hochladen: Dateien hierher ziehen oder klicken"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const files = Array.from(e.dataTransfer.files)
          if (files.length) onFiles(files)
        }}
        className={cn(
          'flex h-full min-h-[210px] flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
          dragging ? 'border-brand bg-brand-50' : 'border-slate-200 bg-slate-50/60 hover:border-brand/50 hover:bg-brand-50/40',
        )}
      >
        <span className={cn('grid size-12 place-items-center rounded-lg border bg-white shadow-card transition-colors', dragging ? 'border-brand text-brand' : 'border-border text-navy-800')}>
          <CloudUpload className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          {dragging ? 'Dateien hier ablegen' : 'Dokumente hierher ziehen oder auswählen'}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">Fachkonzepte, Handbücher, Rundschreiben, Präsentationen · max. 25 MB</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {['PDF', 'DOCX', 'PPTX', 'TXT'].map((t) => (
            <span key={t} className="rounded border border-border bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            <CloudUpload /> Dateien auswählen
          </Button>
          <Button size="sm" variant="outline" onClick={onDemo}>
            <FileText /> Historisches Bauspar-Dokument (Demo)
          </Button>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <ShieldCheck className="size-3.5 text-success" /> Berechtigungsprüfung aktiv – es werden nur freigegebene Inhalte verarbeitet.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.txt"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) onFiles(files)
            e.target.value = ''
          }}
        />
      </div>
    </Card>
  )
}
