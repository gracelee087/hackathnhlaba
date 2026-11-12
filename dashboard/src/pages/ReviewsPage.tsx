import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, CircleX, ClipboardCheck, Info, MessagesSquare, PencilLine, Scale, ShieldCheck } from 'lucide-react'
import type { ReviewRequest } from '@/types'
import { PageHeader, EmptyState, Avatar } from '@/components/ui/misc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/inputs'
import { Progress } from '@/components/ui/progress'
import { Segmented } from '@/components/ui/segmented'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/context/AppContext'
import { REVIEW_THRESHOLD, plausibilityMeta } from '@/lib/plausibility'
import { cn, formatRelative, getInitials } from '@/lib/utils'

const STATUS_LABEL: Record<ReviewRequest['status'], { label: string; variant: 'warning' | 'success' | 'brand' | 'secondary' }> = {
  offen: { label: 'Offen', variant: 'warning' },
  bestaetigt: { label: 'Bestätigt', variant: 'success' },
  korrigiert: { label: 'Korrigiert', variant: 'brand' },
  abgelehnt: { label: 'Abgelehnt', variant: 'secondary' },
}

function ReviewCard({ review }: { review: ReviewRequest }) {
  const { decideReview } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'none' | 'korrigieren' | 'ablehnen'>('none')
  const [text, setText] = useState(review.statement)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const pm = plausibilityMeta(review.plausibility.score)
  const open = review.status === 'offen'

  const submit = (decision: 'bestaetigt' | 'korrigiert' | 'abgelehnt') => {
    if (decision === 'korrigiert' && text.trim().length < 10) {
      setError('Bitte die korrigierte Aussage eingeben (mind. 10 Zeichen).')
      return
    }
    if (decision === 'abgelehnt' && comment.trim().length < 5) {
      setError('Bitte kurz begründen, warum die Aussage abgelehnt wird.')
      return
    }
    decideReview(review.id, decision, { comment: comment.trim() || undefined, correctedStatement: decision === 'korrigiert' ? text.trim() : undefined })
    toast({
      title: decision === 'bestaetigt' ? 'Aussage bestätigt' : decision === 'korrigiert' ? 'Aussage korrigiert' : 'Aussage abgelehnt',
      description:
        decision === 'abgelehnt'
          ? 'Die Aussage fließt nicht in Wissensbasis und Erklärvideos ein.'
          : 'Die Aussage ist freigegeben und wird für Wissensbasis und Erklärvideos genutzt.',
      variant: 'success',
    })
  }

  return (
    <Card className={cn('overflow-hidden', open && 'border-l-[3px] border-l-danger')}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={getInitials(review.employeeName)} tone="slate" />
          <div>
            <p className="text-[14px] font-semibold">{review.employeeName}</p>
            <p className="text-[12px] text-muted-foreground">
              {review.department} · Thema „{review.topic}“ · {formatRelative(review.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11.5px] font-semibold tabular', pm.chip)}>
            <Scale className="size-3.5" /> Plausibilität {review.plausibility.score} %
          </span>
          <Badge variant={STATUS_LABEL[review.status].variant}>{STATUS_LABEL[review.status].label}</Badge>
        </div>
      </div>

      <div className="grid gap-5 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {review.question && (
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Frage der KI</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{review.question}</p>
            </div>
          )}
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Aussage im Interview</p>
            <blockquote className="mt-1 border-l-2 border-slate-300 pl-3 text-[14px] leading-relaxed text-foreground">„{review.statement}“</blockquote>
          </div>
          {review.status === 'korrigiert' && review.correctedStatement && (
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-brand">Korrigierte Fassung</p>
              <p className="mt-1 text-[14px] leading-relaxed">{review.correctedStatement}</p>
            </div>
          )}
          {!open && (
            <p className="text-[12px] text-muted-foreground">
              Entschieden von {review.decidedBy} {review.decidedAt && formatRelative(review.decidedAt)}
              {review.comment && <> · Kommentar: „{review.comment}“</>}
            </p>
          )}
        </div>
        <div className="rounded-md border border-border bg-slate-50/70 p-3.5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Begründung der KI</p>
          <Progress value={review.plausibility.score} className="mt-2" indicatorClassName={pm.bar} label="Plausibilität" />
          <ul className="mt-2.5 space-y-1.5">
            {review.plausibility.reasons.map((r) => (
              <li key={r} className="flex gap-2 text-[12.5px] leading-snug">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" /> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-slate-50/60 px-5 py-4">
          {mode === 'korrigieren' && (
            <div className="mb-3 space-y-1.5">
              <label htmlFor={`fix-${review.id}`} className="text-[13px] font-medium">Korrekte Aussage</label>
              <Textarea id={`fix-${review.id}`} value={text} onChange={(e) => { setText(e.target.value); setError('') }} rows={3} />
            </div>
          )}
          {mode === 'ablehnen' && (
            <div className="mb-3 space-y-1.5">
              <label htmlFor={`why-${review.id}`} className="text-[13px] font-medium">Begründung</label>
              <Textarea id={`why-${review.id}`} value={comment} onChange={(e) => { setComment(e.target.value); setError('') }} rows={2} placeholder="z. B. Widerspricht der gültigen Auszahlungsrichtlinie 2025" />
            </div>
          )}
          {error && <p className="mb-2 text-[13px] text-danger">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'none' && (
              <>
                <Button onClick={() => submit('bestaetigt')}><CircleCheck /> Aussage bestätigen</Button>
                <Button variant="outline" onClick={() => setMode('korrigieren')}><PencilLine /> Korrigieren</Button>
                <Button variant="outline" onClick={() => setMode('ablehnen')}><CircleX /> Ablehnen</Button>
              </>
            )}
            {mode === 'korrigieren' && (
              <>
                <Button onClick={() => submit('korrigiert')}><CircleCheck /> Korrektur übernehmen</Button>
                <Button variant="ghost" onClick={() => { setMode('none'); setError('') }}>Abbrechen</Button>
              </>
            )}
            {mode === 'ablehnen' && (
              <>
                <Button variant="destructive" onClick={() => submit('abgelehnt')}><CircleX /> Endgültig ablehnen</Button>
                <Button variant="ghost" onClick={() => { setMode('none'); setError('') }}>Abbrechen</Button>
              </>
            )}
            <Button variant="link" className="ml-auto" onClick={() => navigate('/expert-knowledge', { state: { interviewId: review.interviewId } })}>
              <MessagesSquare /> Interview ansehen
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function ReviewsPage() {
  const { state, user, can } = useApp()
  const [filter, setFilter] = useState<'offen' | 'erledigt'>('offen')
  const allDepartments = can('board.allDepartments')
  const scoped = useMemo(
    () => state.reviews.filter((r) => allDepartments || r.department === user.department),
    [state.reviews, allDepartments, user.department],
  )
  const list = scoped.filter((r) => (filter === 'offen' ? r.status === 'offen' : r.status !== 'offen'))
  const openCount = scoped.filter((r) => r.status === 'offen').length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vier-Augen-Prüfung"
        description="Aussagen, bei denen die KI unsicher ist, ob sie zutreffen – zur Prüfung durch die zuständige Führungskraft."
        actions={
          <Segmented
            ariaLabel="Filter"
            size="md"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'offen', label: `Offen (${openCount})` },
              { value: 'erledigt', label: 'Erledigt' },
            ]}
          />
        }
      />

      <Card className="flex items-start gap-3 p-4 text-[13px]">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <p className="text-muted-foreground">
          Die KI bewertet die <span className="font-medium text-foreground">Aussage</span>, nicht die Person: Abgleich mit Dokumenten, Konsistenz mit früheren
          Antworten und Eindeutigkeit. Liegt die Plausibilität unter {REVIEW_THRESHOLD} %, wird die Führungskraft benachrichtigt. Erst nach Bestätigung
          fließt die Aussage in Wissensbasis und Erklärvideos ein.
          {!allDepartments && <> Sie sehen Prüfungen für <span className="font-medium text-foreground">{user.department}</span>.</>}
        </p>
      </Card>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={filter === 'offen' ? ShieldCheck : ClipboardCheck}
            title={filter === 'offen' ? 'Keine offenen Prüfungen' : 'Noch keine erledigten Prüfungen'}
            description={filter === 'offen' ? 'Alle Aussagen sind plausibel oder bereits geprüft.' : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  )
}
