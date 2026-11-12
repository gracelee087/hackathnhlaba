import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Captions, Pause, Play, RotateCcw, Mic } from 'lucide-react'
import type { PodcastLine, Slide, VideoScene } from '@/types'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/navigation/Sidebar'
import { formatDuration } from '@/lib/content'
import { cn } from '@/lib/utils'
import { PODCAST_VOICES, preloadVoices, speak, speechAvailable, stopSpeaking } from '@/lib/speech'

/* ------------------------------ Folien ------------------------------ */

export function SlideCanvas({ slide, index, total, compact }: { slide: Slide; index: number; total: number; compact?: boolean }) {
  const isTitle = index === 0
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden rounded-md border border-border', isTitle ? 'bg-navy-800 text-white' : 'bg-white')}>
      <div className={cn('absolute inset-x-0 top-0 h-1', isTitle ? 'bg-brand' : 'bg-navy-800')} />
      <div className={cn('flex h-full flex-col', compact ? 'p-3' : 'p-6 sm:p-8')}>
        {isTitle ? (
          <div className="flex h-full flex-col justify-end">
            <p className={cn('font-semibold uppercase tracking-[0.18em] text-brand-300', compact ? 'text-[6px]' : 'text-[10px] sm:text-[11px]')}>Learning Academy</p>
            <h3 className={cn('mt-2 font-semibold leading-tight', compact ? 'text-[9px]' : 'text-lg sm:text-2xl')}>{slide.title}</h3>
            {!compact && (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-300 sm:text-xs">
                {slide.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <>
            <h3 className={cn('font-semibold leading-tight text-navy-800', compact ? 'text-[8px]' : 'text-base sm:text-xl')}>{slide.title}</h3>
            <ul className={cn('mt-auto space-y-1.5', compact ? 'mb-0' : 'mb-2 sm:space-y-2.5')}>
              {slide.bullets.slice(0, compact ? 3 : 5).map((b) => (
                <li key={b} className={cn('flex gap-2 text-slate-700', compact ? 'text-[5.5px] leading-tight' : 'text-[12px] leading-snug sm:text-[14px]')}>
                  <span className={cn('shrink-0 rounded-full bg-brand', compact ? 'mt-[2px] size-[3px]' : 'mt-1.5 size-1.5')} />
                  <span className={compact ? 'line-clamp-1' : ''}>{b}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {!compact && (
          <div className={cn('mt-4 flex items-center justify-between text-[10px]', isTitle ? 'text-slate-400' : 'text-slate-400')}>
            <span>Helaba Knowledge Intelligence</span>
            <span className="tabular">{index + 1} / {total}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function SlideViewer({ slides, showNotes = true }: { slides: Slide[]; showNotes?: boolean }) {
  const [index, setIndex] = useState(0)
  const safe = Math.min(index, Math.max(0, slides.length - 1))
  const slide = slides[safe]

  useEffect(() => setIndex(0), [slides])

  if (!slide) return <p className="text-[13px] text-muted-foreground">Keine Folien vorhanden.</p>

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        <motion.div key={safe} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
          <SlideCanvas slide={slide} index={safe} total={slides.length} />
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={safe === 0} aria-label="Vorherige Folie">
          <ChevronLeft /> Zurück
        </Button>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Folie ${i + 1}`}
              className={cn('h-1.5 rounded-full transition-all', i === safe ? 'w-5 bg-navy-800' : 'w-1.5 bg-slate-300 hover:bg-slate-400')}
            />
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))} disabled={safe === slides.length - 1} aria-label="Nächste Folie">
          Weiter <ChevronRight />
        </Button>
      </div>
      {showNotes && (
        <div className="rounded-md border border-border bg-slate-50/70 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sprechertext</p>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground">{slide.notes}</p>
        </div>
      )}
      <div className="hidden grid-cols-6 gap-2 sm:grid">
        {slides.map((s, i) => (
          <button key={i} type="button" onClick={() => setIndex(i)} className={cn('rounded-md ring-offset-2 transition', i === safe ? 'ring-2 ring-brand' : 'opacity-70 hover:opacity-100')} aria-label={`Folie ${i + 1}: ${s.title}`}>
            <SlideCanvas slide={s} index={i} total={slides.length} compact />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------- Video ------------------------------- */

export function VideoPlayer({ scenes }: { scenes: VideoScene[] }) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const total = scenes.reduce((a, s) => a + s.durationSec, 0)
  // Ton: der Sprechertext jeder Szene wird per Browser-Sprachausgabe vorgelesen;
  // die Szene wechselt erst, wenn der Text zu Ende gesprochen ist.
  const spoken = useRef(speechAvailable())

  useEffect(() => {
    preloadVoices()
    return () => stopSpeaking()
  }, [])

  useEffect(() => {
    setPlaying(false)
    setElapsed(0)
    stopSpeaking()
  }, [scenes])

  let acc = 0
  let sceneIndex = 0
  for (let i = 0; i < scenes.length; i++) {
    if (elapsed >= acc) sceneIndex = i
    acc += scenes[i].durationSec
  }
  const sceneStart = scenes.slice(0, sceneIndex).reduce((a, s) => a + s.durationSec, 0)
  const sceneEnd = sceneStart + (scenes[sceneIndex]?.durationSec ?? 0)

  useEffect(() => {
    if (!playing) return
    const withSpeech = spoken.current
    const t = window.setInterval(() => {
      setElapsed((e) => {
        if (withSpeech) return Math.min(e + 1, Math.max(sceneStart, sceneEnd - 1)) // Szenenende wartet auf die Stimme
        if (e + 1 >= total) {
          setPlaying(false)
          return total
        }
        return e + 1
      })
    }, withSpeech ? 1000 : 250)
    return () => window.clearInterval(t)
  }, [playing, total, sceneStart, sceneEnd])

  useEffect(() => {
    if (!playing || !spoken.current) return
    const current = scenes[sceneIndex]
    if (!current) return
    let cancelled = false
    speak(current.narration || current.subtitle || current.title, { rate: 1.0 }).then(() => {
      if (cancelled) return
      if (sceneIndex + 1 >= scenes.length) {
        setElapsed(total)
        setPlaying(false)
      } else {
        setElapsed(sceneEnd)
      }
    })
    return () => {
      cancelled = true
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sceneIndex, scenes])

  const scene = scenes[sceneIndex]
  if (!scene) return <p className="text-[13px] text-muted-foreground">Keine Szenen vorhanden.</p>

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-md bg-navy-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,118,168,0.35),transparent_60%)]" />
        <div className="absolute left-4 top-4 flex items-center gap-2 text-[11px] font-medium text-slate-300">
          <BrandMark className="size-6" /> Lernvideo · Szene {sceneIndex + 1}/{scenes.length}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center sm:inset-x-12"
          >
            <h3 className="text-lg font-semibold sm:text-2xl">{scene.title}</h3>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-4 bottom-12 text-center sm:inset-x-10">
          <span className="inline-block rounded bg-black/60 px-2.5 py-1 text-[12px] leading-snug sm:text-[13px]">
            <Captions className="mr-1 inline size-3.5 align-[-2px]" />
            {scene.subtitle}
          </span>
        </div>
        {!playing && elapsed === 0 && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Video abspielen"
            className="absolute inset-0 grid place-items-center bg-navy-950/20 transition-colors hover:bg-navy-950/30"
          >
            <span className="grid size-14 place-items-center rounded-full bg-white text-navy-800 shadow-pop">
              <Play className="ml-0.5 size-6" />
            </span>
          </button>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-6">
          <button
            type="button"
            onClick={() => (elapsed >= total ? (setElapsed(0), setPlaying(true)) : setPlaying((p) => !p))}
            aria-label={playing ? 'Pause' : 'Abspielen'}
            className="text-white/90 hover:text-white"
          >
            {elapsed >= total ? <RotateCcw className="size-4" /> : playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <div
            className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/25"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setElapsed(Math.round(((e.clientX - rect.left) / rect.width) * total))
            }}
            role="slider"
            aria-label="Wiedergabeposition"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={elapsed}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand-300" style={{ width: `${(elapsed / total) * 100}%` }} />
          </div>
          <span className="text-[11px] tabular text-white/80">{formatDuration(elapsed)} / {formatDuration(total)}</span>
        </div>
      </div>
      <p className="text-[11.5px] text-muted-foreground">Simulierte Videovorschau – Wiedergabe beschleunigt (4×).</p>
    </div>
  )
}

export function SceneList({ scenes }: { scenes: VideoScene[] }) {
  let acc = 0
  return (
    <ol className="divide-y divide-border rounded-md border border-border">
      {scenes.map((s, i) => {
        const start = acc
        acc += s.durationSec
        return (
          <li key={i} className="grid gap-1 p-3 sm:grid-cols-[90px_1fr]">
            <span className="text-[11.5px] font-semibold text-slate-500 tabular">
              {formatDuration(start)} – {formatDuration(acc)}
            </span>
            <div>
              <p className="text-[13px] font-semibold">{s.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{s.narration}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------ Podcast ------------------------------ */

export function PodcastPlayer({ lines, title }: { lines: PodcastLine[]; title: string }) {
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  // Ton: Anna und Klaus werden mit zwei Browser-Stimmen vorgelesen; die nächste Zeile
  // beginnt, sobald die aktuelle zu Ende gesprochen ist.
  const spoken = useRef(speechAvailable())

  useEffect(() => {
    preloadVoices()
    return () => stopSpeaking()
  }, [])

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    stopSpeaking()
  }, [lines])

  useEffect(() => {
    if (!playing) return
    const line = lines[current]
    if (!line) return
    let cancelled = false
    const advance = () => {
      if (cancelled) return
      if (current >= lines.length - 1) setPlaying(false)
      else setCurrent((c) => c + 1)
    }
    if (spoken.current) {
      speak(line.text, PODCAST_VOICES[line.speaker] ?? PODCAST_VOICES.Klaus).then(advance)
    } else {
      const t = window.setTimeout(advance, 1800)
      return () => {
        cancelled = true
        window.clearTimeout(t)
      }
    }
    return () => {
      cancelled = true
      stopSpeaking()
    }
  }, [playing, current, lines])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-md border border-border bg-navy-800 p-4 text-white">
        <button
          type="button"
          onClick={() => {
            if (current >= lines.length - 1 && !playing) setCurrent(0)
            setPlaying((p) => !p)
          }}
          aria-label={playing ? 'Podcast pausieren' : 'Podcast abspielen'}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-navy-800 transition-transform hover:scale-105"
        >
          {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-brand-300"><Mic className="size-3.5" /> Wissens-Podcast</p>
          <p className="truncate text-[14px] font-semibold">{title}</p>
          <div className="mt-2 flex h-6 items-end gap-[3px]" aria-hidden="true">
            {Array.from({ length: 48 }, (_, i) => (
              <span
                key={i}
                className={cn('w-full origin-bottom rounded-sm', i / 48 <= current / Math.max(1, lines.length - 1) ? 'bg-brand-300' : 'bg-white/25', playing && 'animate-wave')}
                style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 8) * 0.08}s` }}
              />
            ))}
          </div>
        </div>
      </div>
      <ol className="space-y-2.5">
        {lines.map((l, i) => (
          <li
            key={i}
            className={cn('flex gap-3 rounded-md p-2.5 transition-colors', i === current && (playing || current > 0) ? 'bg-brand-50' : '')}
          >
            <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold', l.speaker === 'Anna' ? 'bg-brand-100 text-brand-700' : 'bg-navy-800 text-white')}>
              {l.speaker[0]}
            </span>
            <div>
              <p className="text-[11.5px] font-semibold text-slate-500">{l.speaker === 'Anna' ? 'Anna · Moderation' : 'Klaus · Fachexperte'}</p>
              <p className="text-[13px] leading-relaxed text-foreground">{l.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
