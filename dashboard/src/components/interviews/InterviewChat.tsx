import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Lightbulb, Save, SendHorizontal, Sparkles, BookOpenCheck } from 'lucide-react'
import type { ExpertInterview } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/inputs'
import { Avatar, DemoBadge } from '@/components/ui/misc'
import { Tooltip } from '@/components/ui/tooltip'
import { nextSuggestion } from '@/lib/interview'
import { useApp } from '@/context/AppContext'
import { TRIGGER_META, triggerOf } from '@/lib/triggers'
import { cn, formatTime } from '@/lib/utils'

export function TypingIndicator({ label = 'KI analysiert die Antwort' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-blink rounded-full bg-brand" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </span>
      {label} …
    </div>
  )
}

export function InterviewChat({
  interview,
  busy,
  onSend,
  onSave,
  onSaveKnowledge,
  onComplete,
}: {
  interview: ExpertInterview
  busy: boolean
  onSend: (text: string) => void
  onSave: () => void
  onSaveKnowledge: () => void
  onComplete: () => void
}) {
  const { state } = useApp()
  const agentEmployee = state.employees.find((e) => e.id === interview.employeeId)
  const agentName = agentEmployee ? TRIGGER_META[triggerOf(agentEmployee)].agent : 'KI-Assistent'
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const suggestion = nextSuggestion(interview)
  const active = interview.status === 'aktiv'

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [interview.messages.length, busy])

  const submit = () => {
    const text = input.trim()
    if (!text || busy || !active) return
    onSend(text)
    setInput('')
  }

  return (
    <Card className="flex min-h-[560px] min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-navy-800 text-white">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold leading-tight">KI-Interviewassistent</p>
            <p className="text-[11.5px] text-muted-foreground">Gezielte Rückfragen · Lücken- und Widerspruchserkennung</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Tooltip content="Zwischenstand speichern">
            <Button size="sm" variant="ghost" onClick={onSave} disabled={!active}>
              <Save /> Speichern
            </Button>
          </Tooltip>
          <Button size="sm" variant="outline" onClick={onSaveKnowledge} disabled={!interview.extracted.length}>
            <BookOpenCheck /> In Knowledge Base speichern
          </Button>
          <Button size="sm" onClick={onComplete} disabled={!active}>
            <CircleCheck /> Abschließen
          </Button>
        </div>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/40 px-4 py-5 scrollbar-thin sm:px-6">
        <AnimatePresence initial={false}>
          {interview.messages.map((m) => {
            const ai = m.role === 'ai'
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-3', !ai && 'flex-row-reverse')}
              >
                {ai ? (
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 text-white">
                    <Sparkles className="size-3.5" />
                  </span>
                ) : (
                  <Avatar initials={interview.expert.initials} tone="brand" />
                )}
                <div className={cn('max-w-[78%]', !ai && 'text-right')}>
                  <div className={cn('mb-1 flex items-center gap-2 text-[11.5px] text-slate-400', !ai && 'justify-end')}>
                    <span className="font-semibold text-slate-600">{ai ? agentName : interview.expert.name}</span>
                    <span>{formatTime(m.timestamp)}</span>
                  </div>
                  <div
                    className={cn(
                      'inline-block rounded-lg px-3.5 py-2.5 text-left text-[13.5px] leading-relaxed',
                      ai ? 'border border-border bg-white text-foreground shadow-card' : 'bg-navy-800 text-white',
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {busy && (
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 text-white">
              <Sparkles className="size-3.5" />
            </span>
            <div className="rounded-lg border border-border bg-white px-3.5 py-3 shadow-card">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-white p-3 sm:p-4">
        {active ? (
          <>
            {suggestion && !busy && (
              <button
                type="button"
                onClick={() => setInput(suggestion)}
                className="mb-2.5 flex w-full items-start gap-2 rounded-md border border-dashed border-brand/30 bg-brand-50/50 px-3 py-2 text-left text-[12.5px] text-brand-700 transition-colors hover:bg-brand-50"
              >
                <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <span className="font-semibold">Demo-Antwort einfügen: </span>
                  {suggestion}
                </span>
              </button>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                rows={2}
                placeholder={`Antwort von ${interview.expert.name} eingeben … (Enter zum Senden)`}
                aria-label="Expertenantwort"
                className="min-h-[52px]"
              />
              <Button onClick={submit} disabled={!input.trim() || busy} size="icon" className="size-[52px] shrink-0" aria-label="Nachricht senden">
                <SendHorizontal className="!size-5" />
              </Button>
            </div>
            <div className="mt-2 flex justify-between">
              <DemoBadge />
              <span className="text-[11px] text-slate-400">Shift + Enter für Zeilenumbruch</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-[13px] text-muted-foreground">
            <CircleCheck className="size-4 text-success" /> Dieses Interview ist abgeschlossen.
          </div>
        )}
      </div>
    </Card>
  )
}
