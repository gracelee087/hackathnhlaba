import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, MessageSquarePlus, SendHorizontal, Trash2, Sparkles, MessagesSquare } from 'lucide-react'
import type { ChatMessage, Conversation } from '@/types'
import { PageHeader } from '@/components/ui/misc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/inputs'
import { Avatar } from '@/components/ui/misc'
import { useToast } from '@/components/ui/toast'
import { AnswerView, SourcePanel } from '@/components/assistant/AnswerView'
import { TypingIndicator } from '@/components/interviews/InterviewChat'
import { useApp } from '@/context/AppContext'
import { aiService } from '@/services/ai-service'
import { cn, formatRelative, nowISO, truncate, uid } from '@/lib/utils'

const SUGGESTIONS = [
  'Welche Besonderheiten muss ich bei historischen Bausparverträgen berücksichtigen?',
  'Wie hoch ist die Wohnungsbauprämie und welche Einkommensgrenzen gelten?',
  'Wann darf die Bausparkasse einen Altvertrag kündigen?',
  'Welche Pflichten gelten nach der Wohnimmobilienkreditrichtlinie?',
]

export default function AssistantPage() {
  const { state, user: currentUser, upsertConversation, deleteConversation } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const handled = useRef(false)

  const conversation = state.conversations.find((c) => c.id === activeId) ?? null
  const answers = conversation?.messages.filter((m) => m.role === 'assistant') ?? []
  const selectedAnswer = (answers.find((m) => m.id === selectedMsgId) ?? answers[answers.length - 1])?.answer

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [conversation?.messages.length, busy])

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || busy) return
    const userMsg: ChatMessage = { id: uid('cm'), role: 'user', text: q, timestamp: nowISO() }
    const base: Conversation = conversation ?? { id: uid('conv'), title: truncate(q, 60), createdAt: nowISO(), updatedAt: nowISO(), messages: [] }
    const withQuestion: Conversation = { ...base, updatedAt: nowISO(), messages: [...base.messages, userMsg] }
    upsertConversation(withQuestion)
    setActiveId(withQuestion.id)
    setInput('')
    setBusy(true)
    try {
      const answer = await aiService.ask(q, state.articles)
      const aiMsg: ChatMessage = { id: uid('cm'), role: 'assistant', text: answer.summary, timestamp: nowISO(), answer }
      upsertConversation({ ...withQuestion, updatedAt: nowISO(), messages: [...withQuestion.messages, aiMsg] })
      setSelectedMsgId(aiMsg.id)
    } catch {
      toast({ title: 'Antwort fehlgeschlagen', description: 'Bitte versuchen Sie es erneut.', variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  // Frage aus anderen Bereichen übernehmen (z. B. Knowledge-Base-Artikel)
  useEffect(() => {
    const q = (location.state as { question?: string } | null)?.question
    if (handled.current || !q) return
    handled.current = true
    navigate(location.pathname, { replace: true, state: null })
    void ask(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newConversation = () => {
    setActiveId(null)
    setSelectedMsgId(null)
    setInput('')
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Knowledge Assistant"
        description="Ihr intelligenter Zugang zum Wissen der Organisation."
        actions={<Button variant="outline" onClick={newConversation}><MessageSquarePlus /> Neue Unterhaltung</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px] xl:h-[calc(100vh-13rem)] xl:min-h-[600px]">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold">Verlauf</p>
            <Button size="icon-sm" variant="ghost" onClick={newConversation} aria-label="Neue Unterhaltung">
              <MessageSquarePlus />
            </Button>
          </div>
          <ul className="max-h-64 min-h-0 flex-1 overflow-y-auto p-1.5 scrollbar-thin lg:max-h-none">
            {state.conversations.length === 0 && <li className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">Noch keine Unterhaltungen</li>}
            {state.conversations.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(c.id)
                    setSelectedMsgId(null)
                  }}
                  className={cn('w-full rounded-md px-3 py-2 pr-8 text-left transition-colors', c.id === activeId ? 'bg-brand-50' : 'hover:bg-slate-50')}
                >
                  <span className="block truncate text-[12.5px] font-medium">{c.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{formatRelative(c.updatedAt)} · {c.messages.length} Nachrichten</span>
                </button>
                <button
                  type="button"
                  aria-label={`Unterhaltung „${c.title}“ löschen`}
                  onClick={() => {
                    deleteConversation(c.id)
                    if (c.id === activeId) newConversation()
                  }}
                  className="absolute right-1.5 top-2 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex min-h-[560px] min-w-0 flex-col overflow-hidden xl:min-h-0">
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-6">
            {!conversation ? (
              <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center py-8 text-center">
                <span className="grid size-12 place-items-center rounded-lg bg-navy-800 text-white">
                  <Bot className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">Wie kann ich helfen?</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Antworten basieren auf der Knowledge Base – inklusive Quellen, Gültigkeitszeiträumen und Konfidenz.
                </p>
                <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void ask(s)}
                      className="flex items-start gap-2 rounded-md border border-border bg-white p-3 text-left text-[12.5px] leading-snug transition-colors hover:border-brand/40 hover:bg-brand-50/40"
                    >
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {conversation.messages.map((m) =>
                  m.role === 'user' ? (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
                      <div className="max-w-[80%] rounded-lg bg-navy-800 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">{m.text}</div>
                      <Avatar initials={currentUser.initials} className="bg-brand text-white" />
                    </motion.div>
                  ) : (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 text-white">
                        <Bot className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {m.answer ? (
                          <AnswerView answer={m.answer} selected={selectedAnswer === m.answer} onSelect={() => setSelectedMsgId(m.id)} />
                        ) : (
                          <p className="text-[13.5px]">{m.text}</p>
                        )}
                      </div>
                    </motion.div>
                  ),
                )}
                {busy && (
                  <div className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 text-white">
                      <Bot className="size-4" />
                    </span>
                    <div className="rounded-lg border border-border bg-white px-3.5 py-3 shadow-card">
                      <TypingIndicator label="Durchsucht Knowledge Base und prüft Gültigkeit" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 sm:p-4">
            {conversation && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {SUGGESTIONS.filter((s) => !conversation.messages.some((m) => m.text === s)).slice(0, 3).map((s) => (
                  <button key={s} type="button" onClick={() => void ask(s)} disabled={busy} className="shrink-0 rounded-full border border-border bg-white px-3 py-1 text-[11.5px] text-slate-600 transition-colors hover:border-brand/40 hover:text-brand-700 disabled:opacity-50">
                    {truncate(s, 52)}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void ask(input)
                  }
                }}
                rows={2}
                placeholder="Frage an die Wissensbasis stellen … (Enter zum Senden)"
                aria-label="Frage an den KI-Assistenten"
                className="min-h-[52px]"
              />
              <Button onClick={() => void ask(input)} disabled={!input.trim() || busy} size="icon" className="size-[52px] shrink-0" aria-label="Frage senden">
                <SendHorizontal className="!size-5" />
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Simulierte Antworten (Demo). Verbindliche Auskünfte nur auf Basis freigegebener Regelungen.</p>
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden lg:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <MessagesSquare className="size-4 text-slate-500" />
            <p className="text-[13px] font-semibold">Quellen & Gültigkeit</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <SourcePanel answer={selectedAnswer} />
          </div>
        </Card>
      </div>
    </div>
  )
}
