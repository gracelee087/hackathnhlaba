import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CircleCheck, CircleX, Lock, RotateCcw, Trophy } from 'lucide-react'
import type { QuizQuestion } from '@/types'
import { Button } from '@/components/ui/button'
import { Progress, ProgressRing } from '@/components/ui/progress'
import { PASSING_SCORE } from '@/lib/learning'
import { cn } from '@/lib/utils'

/**
 * Interaktives Multiple-Choice-Quiz mit Auswertung.
 * onFinish liefert den Score in Prozent.
 */
export function QuizRunner({
  questions,
  passingScore = PASSING_SCORE,
  onFinish,
  onNext,
  nextLabel = 'Nächstes Kapitel',
  hasNext = false,
}: {
  questions: QuizQuestion[]
  passingScore?: number
  onFinish?: (score: number) => void
  onNext?: () => void
  nextLabel?: string
  hasNext?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)

  const reset = () => {
    setIndex(0)
    setSelected(null)
    setChecked(false)
    setAnswers([])
    setFinished(false)
  }

  useEffect(reset, [questions])

  if (!questions.length) return <p className="text-[13px] text-muted-foreground">Für dieses Kapitel sind keine Quizfragen hinterlegt.</p>

  const q = questions[index]
  const correctCount = answers.filter(Boolean).length
  const score = Math.round((correctCount / questions.length) * 100)
  const passed = score >= passingScore

  const check = () => {
    if (selected === null) return
    setChecked(true)
    setAnswers((a) => [...a, selected === q.correctIndex])
  }

  const next = () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
      setChecked(false)
    } else {
      setFinished(true)
      const final = Math.round((answers.filter(Boolean).length / questions.length) * 100)
      onFinish?.(final)
    }
  }

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
        <ProgressRing value={score} size={104} stroke={8} colorClassName={passed ? 'text-success' : 'text-danger'}>
          <span className="text-2xl font-semibold tabular">{score}%</span>
        </ProgressRing>
        <div className={cn('mt-4 flex items-center gap-2 text-base font-semibold', passed ? 'text-success' : 'text-danger')}>
          {passed ? <Trophy className="size-5" /> : <Lock className="size-5" />}
          {passed ? 'Bestanden!' : 'Nicht bestanden'}
        </div>
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
          {correctCount} von {questions.length} Fragen richtig.{' '}
          {passed
            ? hasNext
              ? 'Das nächste Kapitel wurde freigeschaltet.'
              : 'Sie haben diesen Kurs erfolgreich abgeschlossen.'
            : `Mindestens ${passingScore} % sind erforderlich, um das nächste Kapitel freizuschalten.`}
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw /> Erneut versuchen
          </Button>
          {passed && hasNext && onNext && (
            <Button onClick={onNext}>
              {nextLabel} <ArrowRight />
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[12px] text-muted-foreground">
        <span>Frage {index + 1} von {questions.length}</span>
        <span>Bestehensgrenze {passingScore} %</span>
      </div>
      <Progress value={((index + (checked ? 1 : 0)) / questions.length) * 100} className="mt-2" label="Quizfortschritt" />
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
          <p className="mt-5 text-[15px] font-semibold leading-snug text-foreground">{q.question}</p>
          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Antwortmöglichkeiten">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correctIndex
              const isSelected = i === selected
              return (
                <button
                  key={`${q.id}-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={checked}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left text-[13.5px] transition-colors',
                    !checked && (isSelected ? 'border-brand bg-brand-50' : 'border-border bg-white hover:border-slate-300 hover:bg-slate-50'),
                    checked && isCorrect && 'border-success/40 bg-success/[0.07]',
                    checked && isSelected && !isCorrect && 'border-danger/40 bg-danger/[0.06]',
                    checked && !isSelected && !isCorrect && 'border-border bg-white opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                      isSelected && !checked ? 'border-brand bg-brand text-white' : 'border-slate-300 text-slate-500',
                      checked && isCorrect && 'border-success bg-success text-white',
                      checked && isSelected && !isCorrect && 'border-danger bg-danger text-white',
                    )}
                  >
                    {checked && isCorrect ? <CircleCheck className="size-3.5" /> : checked && isSelected ? <CircleX className="size-3.5" /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              )
            })}
          </div>
          {checked && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('mt-4 rounded-md border p-3.5 text-[13px] leading-relaxed', selected === q.correctIndex ? 'border-success/25 bg-success/[0.05]' : 'border-danger/20 bg-danger/[0.04]')}
            >
              <p className={cn('font-semibold', selected === q.correctIndex ? 'text-success' : 'text-danger')}>
                {selected === q.correctIndex ? 'Richtig!' : `Leider falsch – richtig ist: ${q.options[q.correctIndex]}`}
              </p>
              <p className="mt-1 text-muted-foreground">{q.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="mt-5 flex justify-end">
        {checked ? (
          <Button onClick={next}>
            {index < questions.length - 1 ? 'Nächste Frage' : 'Auswertung anzeigen'} <ArrowRight />
          </Button>
        ) : (
          <Button onClick={check} disabled={selected === null}>Antwort prüfen</Button>
        )}
      </div>
    </div>
  )
}
