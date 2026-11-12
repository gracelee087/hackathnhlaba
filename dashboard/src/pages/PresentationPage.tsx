import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CirclePlay,
  ClipboardCheck,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserPlus,
  X,
} from 'lucide-react'
import { ProjectMark } from '@/components/brand/Logo'
import { Floating3D } from '@/components/ui/floating-3d'
import { useApp } from '@/context/AppContext'
import { USERS } from '@/data/mock-data'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------
   Präsentationsmodus: Keynote-Bühne für den Pitch.
   Steuerung: → / Leertaste weiter · ← zurück · Esc beenden
------------------------------------------------------------------- */

const d = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

function useCountUp(target: number, duration = 1600, delay = 300) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    let start = 0
    const timer = window.setTimeout(() => {
      const step = (t: number) => {
        if (!start) start = t
        const p = Math.min(1, (t - start) / duration)
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])
  return value
}

function Kicker({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <p className="k-in inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-medium text-white/75 ring-1 ring-white/10 backdrop-blur" style={d(delay)}>
      <span className="size-1.5 rounded-full bg-brand-300 shadow-[0_0_12px_3px_rgba(255,90,99,0.6)]" />
      {children}
    </p>
  )
}

function Headline({ children, delay = 120, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <h2 className={cn('k-in mt-6 text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[64px] lg:text-[80px]', className)} style={d(delay)}>
      {children}
    </h2>
  )
}

function Sub({ children, delay = 260 }: { children: ReactNode; delay?: number }) {
  return (
    <p className="k-in mt-6 max-w-2xl text-[18px] leading-relaxed text-white/60 sm:text-[21px]" style={d(delay)}>
      {children}
    </p>
  )
}

function Glass({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('rounded-[26px] bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-xl', className)} style={style}>
      {children}
    </div>
  )
}

/* ------------------------------- Folien ------------------------------- */

function SlideTitle() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="k-scale relative" style={d(0)}>
        <div className="k-glow absolute -inset-10 rounded-full bg-brand/30 blur-3xl" />
        <ProjectMark className="relative size-20 rounded-[22px] shadow-[0_20px_60px_-10px_rgba(227,6,19,0.6)]" />
      </div>
      <Kicker delay={250}>HELABA Knowledge Intelligence</Kicker>
      <h1 className="k-in mt-8 text-[54px] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-[88px] lg:text-[112px]" style={d(400)}>
        <span className="text-white">Erfahrung bleibt.</span>
        <br />
        <span className="k-shimmer">Auch wenn Menschen gehen.</span>
      </h1>
      <Sub delay={650}>KI sichert das Projektwissen ausscheidender Mitarbeitender – und macht daraus Erklärvideos für genau die Rollen, die es brauchen.</Sub>
    </div>
  )
}

function SlideProblem() {
  const experts = useCountUp(12)
  const years = useCountUp(28, 1600, 500)
  return (
    <div>
      <Kicker>Das Problem</Kicker>
      <Headline>
        Wissen geht in Rente.
        <br />
        <span className="text-white/40">Leise. Jeden Monat.</span>
      </Headline>
      <div className="mt-14 grid gap-5 sm:grid-cols-3">
        {[
          { value: experts, suffix: '', label: 'Expert:innen mit kritischem Wissen verlassen bald das Haus' },
          { value: years, suffix: ' J.', label: 'durchschnittliche Erfahrung pro Person' },
          { value: '73', suffix: ' %', label: 'dieses Wissens steht in keinem Dokument', static: true },
        ].map((s, i) => (
          <Glass key={s.label} className="k-in p-7" style={d(350 + i * 150)}>
            <p className="text-[64px] font-semibold leading-none tracking-[-0.05em] text-white tabular">
              {s.value}
              <span className="text-brand-300">{s.suffix}</span>
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">{s.label}</p>
          </Glass>
        ))}
      </div>
      <p className="k-in mt-6 text-[12px] text-white/35" style={d(900)}>Demo-Werte zur Veranschaulichung</p>
    </div>
  )
}

function SlideIdea() {
  const steps = [
    { icon: MessagesSquare, title: 'KI-Interview', text: 'fragt nach, wie Projekte wirklich umgesetzt wurden', color: 'from-sky-600 to-navy-700' },
    { icon: ShieldCheck, title: 'Vier-Augen-Prüfung', text: 'Unsichere Aussagen prüft die Führungskraft', color: 'from-brand to-brand-700' },
    { icon: CirclePlay, title: 'Erklärvideo', text: 'nur für die Rollen, die es brauchen', color: 'from-sage-500 to-sage-700' },
  ]
  return (
    <div>
      <Kicker>Unsere Idee</Kicker>
      <Headline>Aus Erfahrung wird Einarbeitung.</Headline>
      <div className="mt-16 grid items-stretch gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.title} className="contents">
              <Glass className="k-scale flex flex-col items-start p-8" style={d(300 + i * 350)}>
                <span className={cn('grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg', s.color)}>
                  <Icon className="size-7" />
                </span>
                <p className="mt-6 text-[26px] font-semibold tracking-[-0.03em] text-white">{s.title}</p>
                <p className="mt-2 text-[16px] leading-relaxed text-white/55">{s.text}</p>
              </Glass>
              {i < steps.length - 1 && (
                <div className="k-left hidden items-center justify-center lg:flex" style={d(500 + i * 350)}>
                  <ArrowRight className="size-8 text-white/30" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SlideBoard() {
  const cols = ['Interview geplant', 'Im KI-Interview', 'Wissen gesichert', 'Ausgeschieden']
  return (
    <div>
      <Kicker>Workforce Board</Kicker>
      <Headline>
        Jede Person.
        <br />
        <span className="text-white/40">Jeder Status. Ein Blick.</span>
      </Headline>
      <Glass className="k-in relative mt-14 p-6" style={d(300)}>
        <div className="grid grid-cols-4 gap-4">
          {cols.map((c, i) => (
            <div key={c} className="min-h-[190px] rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/5">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-white/70">
                <span className={cn('size-2 rounded-full', ['bg-warning', 'bg-brand-300', 'bg-sage-500', 'bg-white/40'][i])} />
                {c}
              </p>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-6 top-[76px]">
          <div className="k-travel w-[calc((100%+1rem)/4)] px-3 pr-7">
            <div className="rounded-2xl bg-white p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-navy-800 text-[13px] font-semibold text-white">KB</span>
                <div>
                  <p className="text-[15px] font-semibold text-navy-900">Klaus Becker</p>
                  <p className="text-[12px] text-slate-500">31 Jahre · Bauspartarife</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="k-fill h-full rounded-full bg-brand" style={{ '--w': '100%', animationDuration: '7s', animationIterationCount: 'infinite' } as CSSProperties} />
              </div>
            </div>
          </div>
        </div>
      </Glass>
    </div>
  )
}

function SlideInterview() {
  const bubbles = [
    { ai: true, text: 'Wie sind Sie bei der Altvertragsprüfung vorgegangen?' },
    { ai: false, text: 'Erst die Tarifgeneration bestimmen, dann die Checkliste abarbeiten.' },
    { ai: true, text: 'Laut Handbuch gehen alle Umstellungen an die Rechtsabteilung – Sie sagen nur vor 2010. Was gilt?' },
  ]
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <Kicker>KI-Interview</Kicker>
        <Headline>Die KI fragt nach. Wie ein neugieriger Kollege.</Headline>
        <Sub>Sie erkennt Lücken, gleicht mit Dokumenten ab und deckt Widersprüche auf – live im Gespräch.</Sub>
      </div>
      <div className="space-y-4">
        {bubbles.map((b, i) => (
          <div key={b.text} className={cn('k-in flex', b.ai ? 'justify-start' : 'justify-end')} style={d(500 + i * 700)}>
            <div
              className={cn(
                'max-w-[85%] rounded-[22px] px-5 py-4 text-[17px] leading-relaxed',
                b.ai ? 'bg-white/[0.08] text-white ring-1 ring-white/10 backdrop-blur-xl' : 'bg-white text-navy-900',
              )}
            >
              {b.ai && (
                <span className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-brand-300">
                  <Sparkles className="size-3.5" /> KI-Assistent
                </span>
              )}
              {b.text}
            </div>
          </div>
        ))}
        <div className="k-in flex items-center gap-2 pl-2 text-[14px] font-medium text-warning" style={d(2700)}>
          <TriangleAlert className="size-4" /> Widerspruch erkannt – wird automatisch markiert
        </div>
      </div>
    </div>
  )
}

function SlideReview() {
  const score = useCountUp(44, 1400, 600)
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <Kicker>Vier-Augen-Prinzip</Kicker>
        <Headline>Unsicher? Dann prüft ein Mensch.</Headline>
        <Sub>Die KI bewertet die Aussage – nicht die Person. Liegt die Plausibilität unter 60 %, wird die Führungskraft benachrichtigt.</Sub>
      </div>
      <Glass className="k-scale p-8" style={d(300)}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/45">Aussage im Interview</p>
        <p className="mt-3 text-[22px] leading-snug text-white">„Ich glaube, das war irgendwie Excel.“</p>
        <div className="mt-8 flex items-end justify-between">
          <p className="text-[13px] font-medium text-white/55">Plausibilität</p>
          <p className="text-[56px] font-semibold leading-none tracking-[-0.05em] text-brand-300 tabular">{score} %</p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="k-fill h-full rounded-full bg-gradient-to-r from-brand to-brand-300" style={{ '--w': '44%', animationDelay: '600ms' } as CSSProperties} />
        </div>
        <div className="k-in mt-8 flex items-center gap-3 rounded-2xl bg-white p-4" style={d(1900)}>
          <span className="k-pulse grid size-11 place-items-center rounded-full bg-brand text-white">
            <ClipboardCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-navy-900">Markus Klein wurde benachrichtigt</p>
            <p className="text-[13px] text-slate-500">Bestätigen · Korrigieren · Ablehnen</p>
          </div>
        </div>
      </Glass>
    </div>
  )
}

function SlideOnboarding() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <Kicker>Onboarding</Kicker>
        <Headline>Tim sieht nur, was Tim braucht.</Headline>
        <Sub>Neue Mitarbeitende bekommen automatisch die Erklärvideos ihrer Rolle – direkt vom Wissen der Kolleg:innen, die gegangen sind.</Sub>
      </div>
      <div className="relative">
        <div className="k-glow absolute -inset-6 rounded-[40px] bg-sky-600/20 blur-3xl" />
        <Glass className="k-scale relative p-6" style={d(300)}>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-700 text-[14px] font-semibold text-white">TW</span>
            <div>
              <p className="text-[17px] font-semibold text-white">Willkommen, Tim.</p>
              <p className="text-[13px] text-white/50">Sachbearbeitung Bestandsverwaltung</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[12px] text-white/70">
              <UserPlus className="size-3.5" /> neu
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { t: 'Altvertragsprüfung', by: 'von Klaus Becker', isNew: true },
              { t: 'Grundlagen Bausparen', by: 'von Monika Hartmann' },
              { t: 'Tarifgenerationen', by: 'von Heinz Albrecht' },
              { t: 'Zuteilung', by: 'von Monika Hartmann' },
            ].map((v, i) => (
              <div key={v.t} className="k-in overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-white/10" style={d(700 + i * 250)}>
                <div className="relative grid aspect-video place-items-center bg-[radial-gradient(120%_120%_at_100%_0%,#24507d_0%,#0a1a2f_100%)]">
                  <span className="grid size-10 place-items-center rounded-full bg-white/90 text-navy-900">
                    <CirclePlay className="size-5" />
                  </span>
                  {v.isNew && <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-semibold text-white">Neu</span>}
                </div>
                <div className="p-3">
                  <p className="text-[14px] font-semibold text-white">{v.t}</p>
                  <p className="text-[12px] text-white/45">{v.by}</p>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}

function SlideImpact() {
  const faster = useCountUp(40)
  const verified = useCountUp(100, 1600, 450)
  const roles = useCountUp(4, 1200, 600)
  return (
    <div>
      <Kicker>Wirkung</Kicker>
      <Headline>Schneller startklar. Sicher geprüft.</Headline>
      <div className="mt-14 grid gap-5 sm:grid-cols-3">
        {[
          { v: `–${faster} %`, l: 'kürzere Einarbeitungszeit (Ziel)' },
          { v: `${verified} %`, l: 'des Wissens geprüft, bevor es gelernt wird' },
          { v: `${roles}`, l: 'Rollen mit eigenen, klaren Rechten' },
        ].map((s, i) => (
          <Glass key={s.l} className="k-in p-8" style={d(300 + i * 150)}>
            <p className="text-[64px] font-semibold leading-none tracking-[-0.05em] text-white tabular">{s.v}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">{s.l}</p>
          </Glass>
        ))}
      </div>
      <p className="k-in mt-6 text-[12px] text-white/35" style={d(900)}>Zielwerte für den Pilotbetrieb – noch nicht gemessen</p>
    </div>
  )
}

function SlideEnd({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="k-scale relative" style={d(0)}>
        <div className="k-glow absolute -inset-12 rounded-full bg-brand/30 blur-3xl" />
        <ProjectMark className="relative size-24 rounded-[26px]" />
      </div>
      <h2 className="k-in mt-10 text-[56px] font-semibold leading-[1] tracking-[-0.05em] sm:text-[96px]" style={d(250)}>
        <span className="k-shimmer">Wissen, das bewegt.</span>
      </h2>
      <Sub delay={450}>Jetzt live: vom Workforce Board über das KI-Interview bis zu Tims Onboarding.</Sub>
      <button
        type="button"
        onClick={onDemo}
        className="k-in group mt-10 inline-flex h-14 items-center gap-3 rounded-full bg-white px-8 text-[16px] font-semibold text-navy-900 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.45)] transition-transform hover:-translate-y-0.5"
        style={d(650)}
      >
        Live-Demo starten <ArrowRight className="size-5 text-brand transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  )
}

/* ------------------------------- Bühne ------------------------------- */

interface SlideDef {
  id: string
  label: string
  demo?: { path: string; label: string; userId?: string }
  render: (ctx: { onDemo: () => void }) => ReactNode
}

const SLIDES: SlideDef[] = [
  { id: 'titel', label: 'Titel', render: () => <SlideTitle /> },
  { id: 'problem', label: 'Problem', render: () => <SlideProblem /> },
  { id: 'idee', label: 'Idee', render: () => <SlideIdea /> },
  { id: 'board', label: 'Workforce Board', demo: { path: '/workforce', label: 'Board live zeigen', userId: 'u-sarah' }, render: () => <SlideBoard /> },
  { id: 'interview', label: 'KI-Interview', demo: { path: '/expert-knowledge', label: 'Interview live zeigen', userId: 'u-sarah' }, render: () => <SlideInterview /> },
  { id: 'pruefung', label: 'Vier-Augen-Prüfung', demo: { path: '/reviews', label: 'Prüfung live zeigen', userId: 'u-markus' }, render: () => <SlideReview /> },
  { id: 'onboarding', label: 'Onboarding', demo: { path: '/dashboard', label: 'Tims Ansicht live zeigen', userId: 'u-tim' }, render: () => <SlideOnboarding /> },
  { id: 'wirkung', label: 'Wirkung', render: () => <SlideImpact /> },
  { id: 'ende', label: 'Abschluss', render: ({ onDemo }) => <SlideEnd onDemo={onDemo} /> },
]

export default function PresentationPage() {
  const navigate = useNavigate()
  const { setCurrentUser } = useApp()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  const next = useCallback(() => setIndex((i) => Math.min(SLIDES.length - 1, i + 1)), [])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const openDemo = useCallback(
    (path = '/workforce', userId = 'u-sarah') => {
      if (USERS.some((u) => u.id === userId)) setCurrentUser(userId)
      navigate(path)
    },
    [navigate, setCurrentUser],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Escape') {
        navigate('/dashboard')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, navigate])

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-950 text-white selection:bg-brand/40">
      {/* Bühne: Lichtkegel, Raster, Orbit */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#173a5e_0%,#0a1a2f_45%,#050d1a_100%)]" />
      <div className="drift-a pointer-events-none absolute -left-40 top-1/4 size-[36rem] rounded-full bg-sky-600/20 blur-[120px]" />
      <div className="drift-b pointer-events-none absolute -right-40 bottom-0 size-[40rem] rounded-full bg-brand/20 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <svg className="k-orbit pointer-events-none absolute left-1/2 top-1/2 size-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="49" fill="none" stroke="white" strokeWidth="0.08" strokeDasharray="0.6 1.4" />
        <circle cx="50" cy="1" r="0.7" fill="#ff5a63" />
      </svg>

      <Floating3D tone="dark" dense className="opacity-60" />

      {/* Kopfzeile */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <ProjectMark className="size-8 rounded-[9px]" />
          <span className="text-[13px] font-semibold tracking-[0.18em] text-white/80">HELABA · KNOWLEDGE INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-2">
          {slide.demo && (
            <button
              type="button"
              onClick={() => openDemo(slide.demo?.path, slide.demo?.userId)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-medium text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
            >
              <CircleCheck className="size-4 text-sage-500" /> {slide.demo.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Präsentation beenden"
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      {/* Folie */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl items-center px-6 pb-28 sm:px-10" aria-live="polite">
        <div key={slide.id} className="w-full">
          {slide.render({ onDemo: () => openDemo('/workforce', 'u-sarah') })}
        </div>
      </main>

      {/* Navigation */}
      <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 px-6 pb-6 sm:px-10">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          aria-label="Vorherige Folie"
          className="grid size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition-all hover:bg-white/20 disabled:opacity-30"
        >
          <ArrowLeft className="size-5" />
        </button>
        <nav aria-label="Folien" className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-3 ring-1 ring-white/10 backdrop-blur">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Folie ${i + 1}: ${s.label}`}
              aria-current={i === index}
              className={cn('h-2 rounded-full transition-all duration-500', i === index ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60')}
            />
          ))}
        </nav>
        <button
          type="button"
          onClick={next}
          disabled={index === SLIDES.length - 1}
          aria-label="Nächste Folie"
          className="grid size-12 place-items-center rounded-full bg-white text-navy-900 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-30"
        >
          <ArrowRight className="size-5" />
        </button>
      </footer>
      <p className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 text-[11.5px] text-white/30">
        {index + 1} / {SLIDES.length} · {slide.label} · ← → oder Leertaste
      </p>
    </div>
  )
}
