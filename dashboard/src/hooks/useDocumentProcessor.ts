import { useCallback } from 'react'
import type { Document, DocumentType } from '@/types'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/components/ui/toast'
import { ANALYSIS_STEPS, aiService } from '@/services/ai-service'
import { nowISO, sleep, uid } from '@/lib/utils'

const EXTENSIONS: Record<string, DocumentType> = { pdf: 'PDF', docx: 'DOCX', pptx: 'PPTX', txt: 'TXT' }
const MAX_SIZE_MB = 25

export const DEMO_DOCUMENT = {
  name: 'Tarifbedingungen_Bauspartarif_Classic_2004.pdf',
  type: 'PDF' as DocumentType,
  sizeKb: 2380,
}

interface UploadInput {
  name: string
  type: DocumentType
  sizeKb: number
  previewText?: string
  file?: File
}

/** Kapselt Upload, simulierte KI-Pipeline und Fehlerbehandlung. */
export function useDocumentProcessor() {
  const { addDocument, updateDocument, logActivity, user: currentUser } = useApp()
  const { toast } = useToast()

  const run = useCallback(
    async (id: string, input: UploadInput) => {
      try {
        for (let p = 10; p <= 100; p += 18) {
          await sleep(110)
          updateDocument(id, { status: 'uploading', progress: Math.min(100, p) })
        }
        updateDocument(id, { status: 'processing', progress: 0, currentStep: 0, error: undefined })
        for (let step = 0; step < ANALYSIS_STEPS.length; step++) {
          updateDocument(id, { currentStep: step, progress: Math.round((step / ANALYSIS_STEPS.length) * 100) })
          await sleep(520 + (step % 3) * 160)
        }
        const analysis = await aiService.analyzeDocument(input)
        updateDocument(id, { status: 'analyzed', progress: 100, currentStep: ANALYSIS_STEPS.length, analysis })
        logActivity({
          type: 'document',
          title: 'Dokument analysiert',
          description: `${input.name} · ${analysis.contradictions.length} mögliche Widersprüche, ${analysis.missingKnowledge.length} Wissenslücken`,
          link: '/documents',
        })
        toast({ title: 'Analyse abgeschlossen', description: input.name, variant: 'success' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
        updateDocument(id, { status: 'error', error: `Analyse fehlgeschlagen: ${message}` })
        toast({ title: 'Analyse fehlgeschlagen', description: message, variant: 'error' })
      }
    },
    [updateDocument, logActivity, toast],
  )

  const start = useCallback(
    (input: UploadInput) => {
      const id = uid('doc')
      const doc: Document = {
        id,
        name: input.name,
        type: input.type,
        sizeKb: input.sizeKb,
        uploadedAt: nowISO(),
        uploadedBy: currentUser.name,
        department: currentUser.department,
        status: 'uploading',
        progress: 0,
        currentStep: 0,
        linkedArticleIds: [],
        previewText: input.previewText,
      }
      addDocument(doc)
      void run(id, input)
      return id
    },
    [addDocument, run, currentUser],
  )

  const handleFiles = useCallback(
    async (files: File[]): Promise<string[]> => {
      const ids: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
        const type = EXTENSIONS[ext]
        if (!type) {
          toast({ title: 'Format nicht unterstützt', description: `${file.name} – erlaubt sind PDF, DOCX, PPTX und TXT.`, variant: 'error' })
          continue
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast({ title: 'Datei zu groß', description: `${file.name} überschreitet ${MAX_SIZE_MB} MB.`, variant: 'error' })
          continue
        }
        let previewText: string | undefined
        if (type === 'TXT') {
          try {
            previewText = (await file.text()).slice(0, 6000)
          } catch {
            previewText = undefined
          }
        }
        ids.push(start({ name: file.name, type, sizeKb: file.size / 1024, previewText, file }))
      }
      return ids
    },
    [start, toast],
  )

  const reanalyze = useCallback(
    (doc: Document) => {
      updateDocument(doc.id, { status: 'uploading', progress: 0, currentStep: 0, error: undefined, analysis: undefined })
      void run(doc.id, { name: doc.name, type: doc.type, sizeKb: doc.sizeKb, previewText: doc.previewText })
    },
    [run, updateDocument],
  )

  const startDemo = useCallback(() => start(DEMO_DOCUMENT), [start])

  return { handleFiles, reanalyze, startDemo }
}
