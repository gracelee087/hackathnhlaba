import { ExternalLink, Mic } from 'lucide-react'
import { PageHeader } from '@/components/ui/misc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Sprachgeführtes KI-Interview (eigene App: STT → Interviewer-Agent → Analyst → RAG-Fakten)
const INTERVIEW_APP_URL = (import.meta.env.VITE_INTERVIEW_APP_URL as string | undefined) || 'http://localhost:3000'

export default function AiInterviewPage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col gap-6">
      <PageHeader
        eyebrow="Wissen vermitteln"
        title="AI Interview"
        description="Sprachgeführtes Experteninterview: Antworten werden transkribiert, geprüft und als Wissenseinheiten gesichert."
        actions={
          <Button variant="outline" onClick={() => window.open(INTERVIEW_APP_URL, '_blank', 'noopener')}>
            <ExternalLink className="size-4" />
            In neuem Tab öffnen
          </Button>
        }
      />
      <Card className="flex min-h-[720px] flex-1 flex-col overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[12px] text-muted-foreground">
          <Mic className="size-3.5 text-brand" />
          Mikrofon im eingebetteten Interview erlauben, wenn der Browser fragt.
        </div>
        <iframe
          title="AI Interview"
          src={INTERVIEW_APP_URL}
          className="h-full min-h-[680px] w-full flex-1 border-0 bg-white"
          allow="microphone; autoplay; clipboard-write"
        />
      </Card>
    </div>
  )
}
