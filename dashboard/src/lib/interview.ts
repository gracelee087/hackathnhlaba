import type { Document, Expert, ExpertInterview, InterviewScriptId } from '@/types'
import { INTERVIEW_SCRIPTS } from '@/services/interview-scripts'
import type { InterviewReply } from '@/services/ai-service'
import { formatDate, nowISO, uid } from '@/lib/utils'
import { REVIEW_THRESHOLD } from '@/lib/plausibility'

export function createInterviewRecord(
  expert: Expert,
  scriptId: InterviewScriptId,
  doc?: Document,
  extra?: { employeeId?: string; projectName?: string },
): ExpertInterview {
  const script = INTERVIEW_SCRIPTS[scriptId]
  const ts = nowISO()
  const intro = script.intro({
    expertName: expert.name.startsWith('Dr.') ? expert.name : `${guessSalutation(expert.name)} ${lastName(expert.name)}`,
    documentName: doc?.name,
    projectName: extra?.projectName,
    exitDate: expert.retirement ? formatDate(expert.retirement) : undefined,
  })
  return {
    id: uid('int'),
    title: extra?.projectName ? `Projekt: ${extra.projectName}` : script.label,
    scriptId,
    expert,
    employeeId: extra?.employeeId,
    projectName: extra?.projectName,
    status: 'aktiv',
    startedAt: ts,
    updatedAt: ts,
    linkedDocumentId: doc?.id,
    linkedDocumentName: doc?.name,
    step: 0,
    messages: intro.map((text) => ({ id: uid('msg'), role: 'ai' as const, text, timestamp: ts })),
    topics: script.topics.map((t) => ({ ...t, done: false })),
    extracted: [],
    pendingQuestion: intro[intro.length - 1],
    followUps: [],
    missingInfo: script.missing.map((m) => ({ ...m, resolved: false })),
    contradictions: [],
    savedArticleIds: [],
  }
}

function lastName(name: string) {
  const parts = name.split(' ')
  return parts[parts.length - 1]
}

function guessSalutation(name: string) {
  const female = ['Monika', 'Petra', 'Birgit', 'Sabine', 'Andrea', 'Elke', 'Sarah', 'Gisela', 'Lisa', 'Nina', 'Julia', 'Aylin']
  return female.includes(name.split(' ')[0]) ? 'Frau' : 'Herr'
}

/** Wendet eine (simulierte) KI-Antwort rein funktional auf ein Interview an. */
export function applyInterviewReply(interview: ExpertInterview, reply: InterviewReply, extractedId: string = uid('ek')): ExpertInterview {
  const ts = nowISO()
  let contradictions = reply.resolveContradictions
    ? interview.contradictions.map((c) => ({ ...c, resolved: true }))
    : interview.contradictions
  if (reply.contradiction) {
    contradictions = [...contradictions, { id: uid('con'), text: reply.contradiction.text, severity: reply.contradiction.severity, resolved: false }]
  }
  return {
    ...interview,
    updatedAt: ts,
    step: interview.step + 1,
    messages: [...interview.messages, { id: uid('msg'), role: 'ai', text: reply.reply, timestamp: ts }],
    extracted: reply.extracted
      ? [
          ...interview.extracted,
          {
            id: extractedId,
            ...reply.extracted,
            status: reply.extracted.plausibility && reply.extracted.plausibility.score < REVIEW_THRESHOLD ? 'pruefung' : 'neu',
            createdAt: ts,
          },
        ]
      : interview.extracted,
    missingInfo: interview.missingInfo.map((m) => (reply.resolveMissing.includes(m.id) ? { ...m, resolved: true } : m)),
    topics: interview.topics.map((t) => (t.id === reply.topicDone ? { ...t, done: true } : t)),
    contradictions,
    pendingQuestion: reply.finished ? null : reply.reply,
    followUps: reply.followUp ? [...interview.followUps, reply.followUp] : interview.followUps,
  }
}

export function interviewCompleteness(interview: ExpertInterview): number {
  const total = interview.missingInfo.length || 1
  const resolved = interview.missingInfo.filter((m) => m.resolved).length
  const relevant = interview.extracted.filter((e) => e.status !== 'abgelehnt')
  const validated = relevant.length ? relevant.filter((e) => e.status === 'validiert').length / relevant.length : 0
  return Math.round(((resolved / total) * 0.8 + validated * 0.2) * 100)
}

export function nextSuggestion(interview: ExpertInterview): string | null {
  if (interview.status !== 'aktiv') return null
  return INTERVIEW_SCRIPTS[interview.scriptId].steps[interview.step]?.suggestion ?? null
}
