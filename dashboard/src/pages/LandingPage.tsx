import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Floating3D } from '@/components/ui/floating-3d'
import {
  ArrowDown,
  ArrowRight,
  Clapperboard,
  GraduationCap,
  Lock,
  MessagesSquare,
  Play,
  Presentation,
  ShieldCheck,
  Sparkles,
  SquareKanban,
  UserCheck,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Reveal } from '@/components/ui/reveal'
import { useApp } from '@/context/AppContext'
import { useMetrics } from '@/hooks/useMetrics'
import { USERS } from '@/data/mock-data'
import { ROLE_LABELS } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import type { EmployeeStatus } from '@/types'

/* ------------------------------------------------------------------
   Kleine Helfer
------------------------------------------------------------------- */

/** Skaliert eine fest gestaltete Komposition passend in ihren Container. */
function useFitScale(baseWidth: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / baseWidth))
    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [baseWidth])
  return { ref, scale }
}

/** Zählt beim ersten Sichtbarwerden ruhig bis zum Zielwert hoch. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(value)
      return
    }
    let frame = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400)
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])
  return (
    <span ref={ref} className="tabular">
      {shown}
    </span>
  )
}

function Eyebrow({ children, onDark = false, center = false }: { children: ReactNode; onDark?: boolean; center?: boolean }) {
  const line = <span className={cn('h-px w-8', onDark ? 'bg-sand-300/70' : 'bg-brand/60')} />
  return (
    <p className={cn('flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em]', center && 'justify-center', onDark ? 'text-sand-300' : 'text-brand')}>
      {line}
      {children}
      {center && line}
    </p>
  )
}

function SectionTitle({ children, onDark = false, className }: { children: ReactNode; onDark?: boolean; className?: string }) {
  return (
    <h2
      className={cn(
        'mt-4 font-display text-[34px] font-medium leading-[1.08] tracking-[-0.015em] sm:text-[44px]',
        onDark ? 'text-white' : 'text-navy-900',
        className,
      )}
    >
      {children}
    </h2>
  )
}

/* ------------------------------------------------------------------
   Eye-Catcher: der Wissensstrom
------------------------------------------------------------------- */

const FLOW_W = 580
const FLOW_H = 520

function FlowCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('absolute rounded-2xl border border-white/70 bg-white/90 p-3.5 shadow-soft backdrop-blur-md', className)}>{children}</div>
  )
}

function VideoCard({ title, meta, tone, className }: { title: string; meta: string; tone: 'sage' | 'sand' | 'sky'; className?: string }) {
  const tones = {
    sage: 'from-sage-600 to-sage-500',
    sand: 'from-sand-600 to-sand-500',
    sky: 'from-navy-700 to-sky-600',
  }
  return (
    <FlowCard className={cn('w-[220px]', className)}>
      <div className="flex items-center gap-3">
        <span className={cn('grid h-11 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white', tones[tone])}>
          <Play className="size-4 fill-current" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold leading-snug text-navy-900">{title}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{meta}</p>
        </div>
      </div>
    </FlowCard>
  )
}

const FLOW_PATHS = {
  in: 'M 204 150 C 250 150, 232 236, 262 252',
  outTop: 'M 330 236 C 370 200, 340 112, 360 104',
  outMid: 'M 344 262 C 352 262, 352 262, 360 262',
  outBottom: 'M 330 290 C 370 330, 340 412, 360 420',
}

function KnowledgeFlow() {
  const { ref, scale } = useFitScale(FLOW_W)
  return (
    <div ref={ref} className="relative w-full" style={{ height: FLOW_H * scale }} aria-hidden="true">
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: FLOW_W, height: FLOW_H, transform: `scale(${scale})` }}>
        <svg viewBox={`0 0 ${FLOW_W} ${FLOW_H}`} className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="262" r="200" fill="url(#core-glow)" />
          <circle cx="300" cy="262" r="168" fill="none" stroke="#c6a36b" strokeOpacity="0.45" strokeDasharray="2 10" strokeWidth="1.5" className="spin-slower" />
          <circle cx="300" cy="262" r="128" fill="none" stroke="#153848" strokeOpacity="0.22" strokeDasharray="3 7" strokeWidth="1.5" className="spin-slow" />
          <circle cx="300" cy="262" r="92" fill="none" stroke="#153848" strokeOpacity="0.1" />
          <circle cx="300" cy="262" r="74" fill="#e30613" className="pulse-soft" />

          {Object.entries(FLOW_PATHS).map(([key, d]) => (
            <path key={key} d={d} fill="none" stroke="#153848" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="4 5" />
          ))}
          {Object.entries(FLOW_PATHS).map(([key, d], i) => (
            <circle key={`dot-${key}`} r="4.5" fill={key === 'in' ? '#c6a36b' : '#e30613'}>
              <animateMotion dur="3.6s" repeatCount="indefinite" begin={`-${i * 0.9}s`} path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </circle>
          ))}
        </svg>

        {/* Links: Mitarbeiter verlässt die Bank */}
        <FlowCard className="float-slow left-0 top-[88px] w-[204px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-2 py-0.5 text-[10.5px] font-semibold text-sand-600">
            <span className="size-1.5 rounded-full bg-sand-500" /> Ruhestand · Interview geplant
          </span>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-navy-800 text-[11.5px] font-semibold text-white">KB</span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-navy-900">Klaus Becker</p>
              <p className="text-[11px] text-slate-500">31 Jahre · Bauspartarife</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10.5px] text-slate-500">
              <span>Wissen gesichert</span>
              <span className="font-semibold text-navy-900">27 %</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[27%] rounded-full bg-sand-500" />
            </div>
          </div>
        </FlowCard>

        {/* Mitte: KI-Interview */}
        <div className="absolute left-[300px] top-[262px] grid size-[132px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#2c6075_0%,#153848_55%,#0f2a38_100%)] text-white shadow-pop ring-8 ring-white/70">
          <div className="text-center">
            <Sparkles className="mx-auto size-5 text-sand-300" />
            <p className="mt-1.5 text-[12.5px] font-semibold">KI-Interview</p>
            <div className="mt-2 flex h-4 items-end justify-center gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="w-[3px] origin-bottom animate-wave rounded-full bg-brand-300" style={{ height: 14, animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Prüf-Chips */}
        <div className="float-slower absolute left-[116px] top-[380px] inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white/95 px-3 py-1.5 text-[11.5px] font-semibold text-sage-700 shadow-card">
          <span className="size-2 rounded-full bg-sage-500" /> Plausibilität 91 %
        </div>
        <div className="float-slow absolute left-[96px] top-[430px] inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/95 px-3 py-1.5 text-[11.5px] font-semibold text-brand-700 shadow-card">
          <ShieldCheck className="size-3.5" /> Unsicher? Führungskraft prüft
        </div>

        {/* Rechts: Erklärvideos für neue Mitarbeitende */}
        <VideoCard className="right-0 top-[64px]" tone="sage" title="Tarifgenerationen erklärt" meta="Erklärvideo" />
        <VideoCard className="right-0 top-[226px]" tone="sky" title="Zuteilung & Bewertungszahl" meta="Lernmodul · 4 Szenen" />
        <FlowCard className="right-0 top-[384px] w-[220px]">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-brand text-[11.5px] font-semibold text-white">TW</span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-navy-900">Onboarding Tim Weber</p>
              <p className="text-[11px] text-slate-500">nur Videos für seine Rolle</p>
            </div>
          </div>
        </FlowCard>

        <p className="absolute left-0 top-[46px] text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">Erfahrung</p>
        <p className="absolute right-0 top-[30px] text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">Einarbeitung</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Seite
------------------------------------------------------------------- */

const STEPS = [
  { icon: SquareKanban, title: 'Erkennen', text: 'Das Kanban zeigt, wer die Bank bald verlässt und wessen Wissen kritisch ist.' },
  { icon: MessagesSquare, title: 'Befragen', text: 'Die KI interviewt die Person zu ihren Projekten und fragt gezielt nach.' },
  { icon: ShieldCheck, title: 'Prüfen', text: 'Jede Aussage erhält einen Plausibilitätswert. Ist die KI unsicher, prüft die Führungskraft.' },
  { icon: Clapperboard, title: 'Weitergeben', text: 'Aus geprüftem Wissen entstehen Erklärvideos – nur für die Rollen, die sie brauchen.' },
]

const ROLE_TEXT: Record<string, string> = {
  knowledge_manager: 'Steuert Interviews, Inhalte und die Wissensbasis.',
  hr: 'Plant Austritte und Nachfolgen im Kanban.',
  teamleitung: 'Prüft unsichere Aussagen im Vier-Augen-Prinzip.',
  neu: 'Sieht nur die Videos, die er für seine Rolle braucht.',
}

const KANBAN_COLUMNS: { status: EmployeeStatus; label: string; dot: string }[] = [
  { status: 'austritt_geplant', label: 'Interview geplant', dot: 'bg-sand-500' },
  { status: 'interview', label: 'Im Interview', dot: 'bg-brand' },
  { status: 'wissen_gesichert', label: 'Wissen gesichert', dot: 'bg-sage-500' },
  { status: 'ausgeschieden', label: 'Ausgeschieden', dot: 'bg-slate-400' },
]

const NAV_LINKS = [
  { href: '#idee', label: 'Idee' },
  { href: '#ablauf', label: 'Ablauf' },
  { href: '#funktionen', label: 'Funktionen' },
  { href: '#rollen', label: 'Rollen' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { state, setCurrentUser } = useApp()
  const metrics = useMetrics()
  const [scrolled, setScrolled] = useState(false)

  const [progress, setProgress] = useState(0)
  const [parallax, setParallax] = useState(0)

  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        const max = document.documentElement.scrollHeight - window.innerHeight
        setProgress(max > 0 ? Math.min(1, y / max) : 0)
        if (!reduce) setParallax(Math.min(60, y * 0.08))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const prev = document.title
    document.title = 'HELABA Knowledge Intelligence – Wissen, das bewegt.'
    return () => {
      document.title = prev
    }
  }, [])

  const openAs = (userId?: string) => {
    if (userId) setCurrentUser(userId)
    window.scrollTo({ top: 0 })
    navigate('/dashboard')
  }

  const facts = [
    { value: metrics.workforce.austritt_geplant, label: 'Interviews geplant – vom Ruhestand bis Projektabschluss' },
    { value: metrics.workforce.interview, label: 'Interviews laufen gerade' },
    { value: metrics.workforce.lostKnowledge, label: 'Austritte, deren Wissen nicht gesichert wurde' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-500',
          scrolled ? 'border-b border-border/80 bg-background/85 shadow-card backdrop-blur-xl' : 'border-b border-transparent',
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-gradient-to-r from-brand via-brand to-sand-500"
          style={{ transform: `scaleX(${progress})` }}
        />
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
          <a href="#top" aria-label="Zum Seitenanfang">
            <Logo />
          </a>
          <nav aria-label="Startseite" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[13.5px] font-medium text-navy-800/75 transition-colors hover:text-navy-900">
                {l.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => openAs()}
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-navy-800 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-navy-900 sm:px-5"
          >
            Demo<span className="hidden sm:inline"> öffnen</span> <ArrowRight className="size-4" />
          </button>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-[72px]">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[linear-gradient(160deg,#eef3ec_0%,#f7f2e8_45%,#f4ece4_100%)]" />
            <div className="drift-a absolute -left-40 -top-40 size-[640px] rounded-full bg-sage-500/30 blur-[90px]" />
            <div className="drift-b absolute -right-40 -top-10 size-[600px] rounded-full bg-sand-500/35 blur-[90px]" />
            <div className="drift-b absolute left-[38%] top-[30%] size-[420px] rounded-full bg-sky-600/15 blur-[90px]" />
            <div className="drift-a absolute bottom-[-260px] right-[18%] size-[520px] rounded-full bg-brand/15 blur-[100px]" />
            <div className="grain absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />
          </div>
          <Floating3D tone="light" dense />

          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pb-28 lg:pt-20">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-[12px] font-medium text-navy-800 shadow-card backdrop-blur">
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand/50" />
                    <span className="relative size-2 rounded-full bg-brand" />
                  </span>
                  KI-gestützter Wissenstransfer · Futury Build Days
                </span>
              </Reveal>
              <Reveal delay={90}>
                <h1 className="mt-7 font-display text-[44px] font-medium leading-[1.02] tracking-[-0.025em] text-navy-900 sm:text-[60px] lg:text-[68px]">
                  Erfahrung bleibt.
                  <br />
                  Auch wenn <em className="font-normal italic text-brand">Menschen</em> gehen.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-slate-600">
                  Bevor erfahrene Kolleginnen und Kollegen die Helaba verlassen, führt eine KI ein Interview über ihre Projekte. Daraus entstehen
                  geprüfte Erklärvideos – genau für die Rollen, die dieses Wissen brauchen.
                </p>
              </Reveal>
              <Reveal delay={270}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openAs()}
                    className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-brand px-6 text-[14.5px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(227,6,19,0.65)] transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-brand-600"
                  >
                    Demo starten
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                  <a
                    href="#ablauf"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-navy-800/15 bg-white/60 px-6 text-[14.5px] font-semibold text-navy-900 backdrop-blur transition-colors hover:bg-white"
                  >
                    So funktioniert’s <ArrowDown className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => navigate('/praesentation')}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-6 text-[14.5px] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <Presentation className="size-4" /> Präsentation
                  </button>
                </div>
              </Reveal>
              <Reveal delay={360}>
                <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-slate-600">
                  {[
                    { icon: UserCheck, text: 'Vier-Augen-Prinzip' },
                    { icon: Lock, text: 'Rollenbasierte Rechte' },
                    { icon: ShieldCheck, text: 'Bewertet Aussagen, nicht Menschen' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="inline-flex items-center gap-2">
                      <Icon className="size-4 text-sage-600" /> {text}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <div style={{ transform: `translate3d(0, ${parallax}px, 0)` }} className="will-change-transform">
                <KnowledgeFlow />
              </div>
            </Reveal>
          </div>

          <a
            href="#idee"
            aria-label="Weiter zur Idee"
            className="scroll-cue absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-navy-800/50 transition-colors hover:text-navy-900 lg:flex"
          >
            Entdecken
            <span className="relative block h-9 w-[1.5px] overflow-hidden rounded-full bg-navy-800/15">
              <span className="scroll-cue-dot absolute inset-x-0 top-0 h-3 rounded-full bg-brand" />
            </span>
          </a>
        </section>

        {/* Idee */}
        <section id="idee" className="scroll-mt-20 bg-white py-24 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
            <Reveal>
              <Eyebrow>Die Idee</Eyebrow>
              <SectionTitle>
                Wenn erfahrene Menschen gehen, geht ihr Wissen oft mit. <span className="text-slate-400">Wir halten es fest.</span>
              </SectionTitle>
              <p className="mt-6 max-w-[540px] text-[16px] leading-relaxed text-slate-600">
                Statt dicker Übergabeordner entsteht strukturiertes, geprüftes Wissen – als kurze Videos und Lernmodule, die neue Mitarbeitende vom
                ersten Tag an begleiten.
              </p>
            </Reveal>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-1">
              {facts.map((f, i) => (
                <Reveal key={f.label} delay={i * 110} className="h-full">
                  <div className="flex h-full items-baseline gap-5 bg-white px-6 py-6">
                    <span className="font-display text-[46px] font-medium leading-none text-navy-900">
                      <CountUp value={f.value} />
                    </span>
                    <span className="text-[14px] leading-snug text-slate-600">{f.label}</span>
                  </div>
                </Reveal>
              ))}
              <p className="bg-white px-6 pb-4 text-[11.5px] text-slate-400 sm:col-span-3 lg:col-span-1">Werte aus den Demo-Daten</p>
            </div>
          </div>
        </section>

        {/* Ablauf */}
        <section id="ablauf" className="relative scroll-mt-20 overflow-hidden bg-sand-50 py-24 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal className="max-w-[720px]">
              <Eyebrow>Der Ablauf</Eyebrow>
              <SectionTitle>Vom Abschied zum Einarbeitungsvideo – in vier Schritten.</SectionTitle>
            </Reveal>

            <Reveal className="relative mt-16">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[27px] hidden h-[1.5px] origin-left scale-x-0 bg-sand-300 transition-transform delay-300 duration-[1800ms] ease-out lg:block [.reveal-in_&]:scale-x-100"
              />
              <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {STEPS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title}>
                    <div className="flex flex-col items-start lg:items-center lg:text-center">
                      <span className="relative grid size-14 place-items-center rounded-full border border-sand-300 bg-white text-navy-800 shadow-card">
                        <Icon className="size-[22px]" />
                        <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{i + 1}</span>
                      </span>
                      <h3 className="mt-6 font-display text-[22px] font-medium text-navy-900">{title}</h3>
                      <p className="mt-2 max-w-[260px] text-[14.5px] leading-relaxed text-slate-600">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* Funktionen */}
        <section id="funktionen" className="scroll-mt-20 bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal className="max-w-[720px]">
              <Eyebrow>Funktionen</Eyebrow>
              <SectionTitle>Alles, was der Wissenstransfer braucht – an einem Ort.</SectionTitle>
            </Reveal>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {/* Kanban */}
              <Reveal className="lg:col-span-2">
                <article className="lift h-full rounded-3xl border border-border bg-background p-7">
                  <SquareKanban className="size-5 text-brand" />
                  <h3 className="mt-4 font-display text-[24px] font-medium text-navy-900">Wissens-Kanban</h3>
                  <p className="mt-1.5 max-w-[460px] text-[14.5px] text-slate-600">Wer wird interviewt, aus welchem Anlass – und welcher KI-Agent sichert das Wissen.</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {KANBAN_COLUMNS.map((col) => {
                      const people = state.employees.filter((e) => e.status === col.status)
                      return (
                        <div key={col.status} className="rounded-2xl bg-white p-3 shadow-card">
                          <div className="flex items-center justify-between text-[11.5px] font-semibold text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={cn('size-2 rounded-full', col.dot)} /> {col.label}
                            </span>
                            <span className="text-navy-900">{people.length}</span>
                          </div>
                          <ul className="mt-3 space-y-1.5">
                            {people.slice(0, 3).map((p) => (
                              <li key={p.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-navy-800 text-[8.5px] font-semibold text-white">{p.initials}</span>
                                <span className="truncate text-[11.5px] text-navy-900">{p.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </article>
              </Reveal>

              {/* Vier-Augen-Prüfung */}
              <Reveal delay={120}>
                <article className="lift h-full rounded-3xl border border-border bg-background p-7">
                  <ShieldCheck className="size-5 text-brand" />
                  <h3 className="mt-4 font-display text-[24px] font-medium text-navy-900">Vier-Augen-Prüfung</h3>
                  <p className="mt-1.5 text-[14.5px] text-slate-600">Unsichere Aussagen gehen automatisch an die zuständige Führungskraft.</p>
                  <div className="mt-6 space-y-3 rounded-2xl bg-white p-4 shadow-card">
                    {[
                      { label: 'Klare Aussage mit Beleg', score: 91, bar: 'bg-sage-500' },
                      { label: 'Vage Formulierung', score: 69, bar: 'bg-sand-500' },
                      { label: 'Widerspruch zu Dokumenten', score: 21, bar: 'bg-brand' },
                    ].map((r) => (
                      <div key={r.label}>
                        <div className="flex justify-between text-[11.5px]">
                          <span className="text-slate-600">{r.label}</span>
                          <span className="font-semibold text-navy-900">{r.score} %</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                          <div className={cn('h-full rounded-full', r.bar)} style={{ width: `${r.score}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="border-t border-border pt-3 text-[11.5px] text-slate-500">Unter 60 % → Prüfung durch die Führungskraft</p>
                  </div>
                </article>
              </Reveal>

              {/* Onboarding */}
              <Reveal>
                <article className="lift h-full rounded-3xl border border-border bg-background p-7">
                  <GraduationCap className="size-5 text-brand" />
                  <h3 className="mt-4 font-display text-[24px] font-medium text-navy-900">Onboarding nach Rolle</h3>
                  <p className="mt-1.5 text-[14.5px] text-slate-600">Neue Mitarbeitende sehen nur die Videos, die sie für ihren Beruf brauchen.</p>
                  <ul className="mt-6 space-y-2">
                    {['Grundlagen des Bausparens', 'Historische Tarifgenerationen', 'Zuteilung & Bewertungszahl'].map((t) => (
                      <li key={t} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-card">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sage-100 text-sage-700">
                          <Play className="size-3 fill-current" />
                        </span>
                        <span className="truncate text-[12.5px] font-medium text-navy-900">{t}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>

              {/* Rechte */}
              <Reveal delay={120}>
                <article className="lift h-full rounded-3xl border border-border bg-background p-7">
                  <Lock className="size-5 text-brand" />
                  <h3 className="mt-4 font-display text-[24px] font-medium text-navy-900">Klare Berechtigungen</h3>
                  <p className="mt-1.5 text-[14.5px] text-slate-600">Jede Rolle sieht genau die Informationen, die sie sehen darf – Austrittsgründe nur HR.</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {USERS.map((u) => (
                      <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-navy-900">
                        <Lock className="size-3 text-slate-400" /> {ROLE_LABELS[u.appRole]}
                      </span>
                    ))}
                  </div>
                </article>
              </Reveal>

              {/* KI */}
              <Reveal delay={240}>
                <article className="lift relative h-full overflow-hidden rounded-3xl bg-navy-800 p-7 text-white">
                  <div className="drift-b pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
                  <Sparkles className="relative size-5 text-sand-300" />
                  <h3 className="relative mt-4 font-display text-[24px] font-medium">KI, die nachfragt</h3>
                  <p className="relative mt-1.5 text-[14.5px] text-white/75">Interviews, Videos und Lernmodule entstehen aus echten Projekten – angebunden über eine offene Schnittstelle.</p>
                  <div className="relative mt-6 space-y-2.5 text-[12.5px]">
                    <p className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-white/90">
                      Wie sind Sie bei Verträgen der Generation A vorgegangen?
                    </p>
                    <p className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-white px-3.5 py-2.5 text-navy-900">
                      Zuerst prüfe ich das Datum des Vertragsabschlusses …
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-[11.5px] text-sand-300">
                      <Sparkles className="size-3" /> Rückfrage folgt
                    </p>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Rollen */}
        <section id="rollen" className="scroll-mt-20 bg-sage-100/60 py-24 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal className="max-w-[720px]">
              <Eyebrow>Rollen</Eyebrow>
              <SectionTitle>Eine Plattform, vier Blickwinkel.</SectionTitle>
              <p className="mt-5 text-[16px] text-slate-600">Wählen Sie eine Rolle und erleben Sie die Demo aus ihrer Sicht.</p>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {USERS.map((u, i) => (
                <Reveal key={u.id} delay={i * 100} className="h-full">
                  <button
                    type="button"
                    onClick={() => openAs(u.id)}
                    className="lift group flex h-full w-full flex-col rounded-3xl border border-white bg-white/85 p-6 text-left shadow-card"
                  >
                    <span
                      className={cn(
                        'grid size-12 place-items-center rounded-full text-[14px] font-semibold text-white',
                        u.appRole === 'neu' ? 'bg-brand' : u.appRole === 'teamleitung' ? 'bg-sage-600' : u.appRole === 'hr' ? 'bg-sand-600' : 'bg-navy-800',
                      )}
                    >
                      {u.initials}
                    </span>
                    <span className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">{ROLE_LABELS[u.appRole]}</span>
                    <span className="mt-1 font-display text-[22px] font-medium text-navy-900">{u.name}</span>
                    <span className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">{ROLE_TEXT[u.appRole]}</span>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand">
                      Als {u.name.split(' ')[0]} ansehen
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Werte & Abschluss */}
        <section className="relative overflow-hidden bg-navy-900 py-24 text-white sm:py-32">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="drift-a absolute -left-24 top-0 size-[420px] rounded-full bg-sage-600/25 blur-3xl" />
            <div className="drift-b absolute -right-24 bottom-0 size-[420px] rounded-full bg-brand/25 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal className="mx-auto max-w-[820px] text-center">
              <Eyebrow onDark center>
                Unser Anspruch
              </Eyebrow>
              <p className="mt-6 font-display text-[44px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[64px]">
                Wissen, das <em className="font-normal italic text-brand-300">bewegt.</em>
              </p>
            </Reveal>
            <div className="mx-auto mt-14 grid max-w-[980px] gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
              {[
                { title: 'Verlässlich', text: 'Jede Aussage ist bewertet und nachvollziehbar.' },
                { title: 'Menschlich', text: 'Geprüft werden Aussagen, nicht die Person.' },
                { title: 'Nach vorne gerichtet', text: 'Neue Kolleginnen und Kollegen lernen von Erfahrung.' },
              ].map((v, i) => (
                <Reveal key={v.title} delay={i * 110} className="h-full">
                  <div className="h-full bg-navy-900/70 px-6 py-7 backdrop-blur">
                    <p className="font-display text-[20px] font-medium">{v.title}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/70">{v.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-14 flex justify-center">
              <button
                type="button"
                onClick={() => openAs()}
                className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-7 text-[14.5px] font-semibold text-navy-900 transition-transform duration-300 hover:-translate-y-0.5"
              >
                Demo starten
                <ArrowRight className="size-4 text-brand transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-navy-950 py-10 text-white/60">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo onDark />
          <p className="text-[12px]">Hackathon-Prototyp · Futury Build Days · simulierte KI, fiktive Daten</p>
        </div>
      </footer>
    </div>
  )
}
