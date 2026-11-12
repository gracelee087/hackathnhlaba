import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessagesSquare, Plus } from 'lucide-react'
import type { InterviewScriptId } from '@/types'
import { PageHeader, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Label, NativeSelect } from '@/components/ui/inputs'
import { useToast } from '@/components/ui/toast'
import { InterviewChat } from '@/components/interviews/InterviewChat'
import { InsightsPanel, InterviewInfoPanel } from '@/components/interviews/InterviewPanels'
import { useApp } from '@/context/AppContext'
import { INTERVIEW_SCRIPTS } from '@/services/interview-scripts'
import { aiService } from '@/services/ai-service'
import { DEPARTMENT_HEADS, REVIEW_THRESHOLD } from '@/lib/plausibility'
import { formatDate, nowISO, uid } from '@/lib/utils'

interface LocationState {
  startInterview?: boolean
  documentId?: string
  employeeId?: string
  interviewId?: string
}

export default function ExpertKnowledgePage() {
  const { state, createInterview, updateInterview, submitInterviewReply, saveInterviewKnowledge, completeInterview } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<string | undefined>(() => state.interviews[0]?.id)
  const [busy, setBusy] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<{ employeeId: string; scriptId: InterviewScriptId; documentId: string }>({
    employeeId: 'e-becker',
    scriptId: 'projekt',
    documentId: '',
  })
  const handled = useRef(false)

  // Einstieg über Dashboard / Document Intelligence
  useEffect(() => {
    const st = location.state as LocationState | null
    if (handled.current || !st) return
    if (st.interviewId) {
      handled.current = true
      setActiveId(st.interviewId)
      navigate(location.pathname, { replace: true, state: null })
      return
    }
    if (!st.startInterview) return
    handled.current = true
    const id = createInterview({ documentId: st.documentId, employeeId: st.employeeId })
    setActiveId(id)
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const interview = state.interviews.find((i) => i.id === activeId) ?? state.interviews[0]
  const analyzedDocs = state.documents.filter((d) => d.analysis)

  const send = async (text: string) => {
    if (!interview) return
    const id = interview.id
    const expertMessage = { id: uid('msg'), role: 'expert' as const, text, timestamp: nowISO() }
    const snapshot = { ...interview, messages: [...interview.messages, expertMessage] }
    updateInterview(id, (i) => ({ ...i, messages: [...i.messages, expertMessage], updatedAt: nowISO() }))
    setBusy(true)
    try {
      const reply = await aiService.interviewReply(snapshot, text)
      submitInterviewReply(id, reply)
      const score = reply.extracted?.plausibility?.score
      if (score !== undefined && score < REVIEW_THRESHOLD) {
        toast({
          title: `Aussage zur Vier-Augen-Prüfung (${score} %)`,
          description: `Die KI ist unsicher, ob die Aussage zutrifft. ${DEPARTMENT_HEADS[interview.expert.department]} wurde zur Prüfung benachrichtigt.`,
          variant: 'warning',
        })
      } else if (reply.contradiction) {
        toast({ title: 'Widerspruch erkannt', description: 'Die KI hat eine Abweichung zu vorhandenen Dokumenten gefunden.', variant: 'warning' })
      }
    } catch {
      toast({ title: 'Antwort konnte nicht verarbeitet werden', description: 'Bitte erneut senden.', variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const validate = (ekId: string) => {
    if (!interview) return
    updateInterview(interview.id, (i) => ({
      ...i,
      extracted: i.extracted.map((e) => (e.id === ekId ? { ...e, status: 'validiert' } : e)),
    }))
  }

  const save = () => {
    if (!interview) return
    updateInterview(interview.id, (i) => ({ ...i, savedAt: nowISO() }))
    toast({ title: 'Interview gespeichert', description: 'Der Zwischenstand wurde gesichert.', variant: 'success' })
  }

  const saveKnowledge = () => {
    if (!interview) return
    const articleId = saveInterviewKnowledge(interview.id)
    if (!articleId) {
      toast({ title: 'Noch kein Wissen extrahiert', description: 'Beantworten Sie zuerst mindestens eine Frage.', variant: 'warning' })
      return
    }
    const unvalidated = interview.extracted.some((e) => e.status !== 'validiert')
    toast({
      title: 'Wissen in Knowledge Base gespeichert',
      description: unvalidated ? 'Status „Prüfung erforderlich“ – nicht alle Aussagen sind validiert.' : 'Alle Aussagen validiert – Status „Aktuell“.',
      variant: 'success',
      action: { label: 'Artikel öffnen', onClick: () => navigate(`/knowledge-base/${articleId}`) },
    })
  }

  const complete = () => {
    if (!interview) return
    const articleId = completeInterview(interview.id)
    toast({
      title: 'Interview abgeschlossen',
      description: articleId ? 'Das Wissen wurde gespeichert und kann jetzt in ein Lernmodul überführt werden.' : 'Es wurde kein Wissen extrahiert.',
      variant: 'success',
      action: articleId
        ? {
            label: 'Erklärvideo für Nachfolge erstellen',
            onClick: () => navigate('/content-studio', { state: { articleIds: [articleId], format: 'video', audience: 'Anfänger' } }),
          }
        : undefined,
    })
  }

  const startNew = () => {
    const id = createInterview({ employeeId: form.employeeId, scriptId: form.scriptId, documentId: form.documentId || undefined })
    setActiveId(id)
    setDialogOpen(false)
    toast({ title: 'Interview gestartet', description: state.employees.find((e) => e.id === form.employeeId)?.name })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expert Knowledge"
        description="Sichern Sie wertvolles Erfahrungswissen durch intelligente KI-Interviews."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Neues Interview starten
          </Button>
        }
      />

      {interview ? (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[290px_minmax(0,1fr)_340px] 2xl:h-[calc(100vh-13rem)] 2xl:min-h-[620px]">
          <InterviewInfoPanel interview={interview} interviews={state.interviews} onSelect={setActiveId} onNew={() => setDialogOpen(true)} />
          <InterviewChat
            interview={interview}
            busy={busy}
            onSend={send}
            onSave={save}
            onSaveKnowledge={saveKnowledge}
            onComplete={complete}
          />
          <div className="lg:col-span-2 2xl:col-span-1 2xl:flex 2xl:min-h-0 [&>*]:flex-1">
            <InsightsPanel interview={interview} onValidate={validate} />
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={MessagesSquare}
            title="Noch keine Interviews"
            description="Starten Sie ein KI-geführtes Interview, um Erfahrungswissen zu sichern."
            action={<Button onClick={() => setDialogOpen(true)}><Plus /> Interview starten</Button>}
          />
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Neues Experteninterview"
        description="Die KI bereitet Fragen auf Basis vorhandener Dokumente und Wissenslücken vor."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={startNew}>Interview starten</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="expert">Expertin / Experte</Label>
            <NativeSelect id="expert" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
              {state.employees
                .filter((e) => e.status === 'austritt_geplant' || e.status === 'interview' || e.status === 'wissen_gesichert')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} – {e.title}{e.exitDate ? ` (Austritt ${formatDate(e.exitDate)})` : ''}
                  </option>
                ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="script">Interview-Leitfaden</Label>
            <NativeSelect id="script" value={form.scriptId} onChange={(e) => setForm((f) => ({ ...f, scriptId: e.target.value as InterviewScriptId }))}>
              {Object.values(INTERVIEW_SCRIPTS).map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc">Grundlage (optional)</Label>
            <NativeSelect id="doc" value={form.documentId} onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))}>
              <option value="">Kein Dokument</option>
              {analyzedDocs.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
