/* ------------------------------------------------------------------
   Backend-Implementierung des AIService.
   Die Endpunkte und JSON-Formate sind in API.md beschrieben.

   Fallback: Ist VITE_AI_FALLBACK=true (Standard), wird bei einem
   Backend-Fehler automatisch die simulierte KI genutzt – praktisch
   für die Live-Demo, falls das Backend kurz ausfällt.
------------------------------------------------------------------- */
import type { AssistantAnswer, DocumentAnalysis, GeneratedContent } from '@/types'
import type { AIService, InterviewReply } from '@/services/ai-service'
import { api } from '@/services/api-client'

const FALLBACK_ENABLED = import.meta.env.VITE_AI_FALLBACK !== 'false'

async function withFallback<T>(label: string, call: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (error) {
    if (!FALLBACK_ENABLED) throw error
    console.warn(`[AI-Backend] ${label} fehlgeschlagen – nutze Simulation.`, error)
    return fallback()
  }
}

export function createHttpAIService(fallback: AIService): AIService {
  return {
    analyzeDocument(input) {
      return withFallback(
        'analyzeDocument',
        () => {
          const form = new FormData()
          form.append('name', input.name)
          form.append('type', input.type)
          if (input.previewText) form.append('previewText', input.previewText)
          if (input.file) form.append('file', input.file, input.name)
          return api.upload<DocumentAnalysis>('/api/documents/analyze', form)
        },
        () => fallback.analyzeDocument(input),
      )
    },

    interviewReply(interview, expertText) {
      return withFallback(
        'interviewReply',
        () =>
          api.post<InterviewReply>('/api/interviews/reply', {
            interviewId: interview.id,
            employeeId: interview.employeeId ?? null,
            projectName: interview.projectName ?? null,
            step: interview.step,
            scriptId: interview.scriptId,
            expert: interview.expert,
            linkedDocumentName: interview.linkedDocumentName ?? null,
            messages: interview.messages.map(({ role, text, timestamp }) => ({ role, text, timestamp })),
            missingInfo: interview.missingInfo,
            topics: interview.topics,
            expertText,
          }),
        () => fallback.interviewReply(interview, expertText),
      )
    },

    generateContent(request) {
      return withFallback(
        'generateContent',
        () =>
          api
            .post<GeneratedContent>('/api/content/generate', {
              format: request.format,
              audience: request.audience,
              difficulty: request.difficulty,
              targetRoles: request.targetRoles,
              articles: request.articles,
            })
            .then((c) => ({ ...c, targetRoles: c.targetRoles ?? request.targetRoles })),
        () => fallback.generateContent(request),
      )
    },

    ask(question, articles) {
      return withFallback(
        'ask',
        () => api.post<AssistantAnswer>('/api/assistant/ask', { question, articles }),
        () => fallback.ask(question, articles),
      )
    },
  }
}
