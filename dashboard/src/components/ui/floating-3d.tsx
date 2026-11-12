import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Bewegte 3D-Figuren im Hintergrund – reines CSS-3D (kein WebGL nötig).
 * Würfel, Ring, Kugel, Prisma und das Projektzeichen als dicke 3D-Kachel.
 * Folgt sanft der Maus (Parallax), respektiert „Bewegung reduzieren“.
 */

type Tone = 'light' | 'dark'

function Cube({ size, tone, accent = false }: { size: number; tone: Tone; accent?: boolean }) {
  const half = size / 2
  const faces = [
    `rotateY(0deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ]
  return (
    <div className="f3d-spin relative" style={{ width: size, height: size }}>
      {faces.map((t, i) => (
        <span
          key={i}
          className={cn(
            'absolute inset-0 rounded-[18%] border backdrop-blur-[2px]',
            tone === 'dark'
              ? accent
                ? 'border-brand-300/60 bg-gradient-to-br from-brand/35 to-brand-700/10'
                : 'border-white/25 bg-gradient-to-br from-white/[0.14] to-white/[0.02]'
              : accent
                ? 'border-brand/35 bg-gradient-to-br from-brand/20 to-white/40'
                : 'border-navy-800/15 bg-gradient-to-br from-white/80 to-sky-100/40',
          )}
          style={{ transform: t }}
        />
      ))}
    </div>
  )
}

function Ring({ size, tone }: { size: number; tone: Tone }) {
  const layers = 7
  return (
    <div className="f3d-tumble relative" style={{ width: size, height: size }}>
      {Array.from({ length: layers }).map((_, i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            transform: `translateZ(${(i - layers / 2) * 2.2}px)`,
            border: `${Math.max(6, size / 9)}px solid`,
            borderColor:
              tone === 'dark'
                ? `rgba(255,${90 + i * 8},${99 + i * 8},${0.28 + i * 0.04})`
                : `rgba(227,6,19,${0.1 + i * 0.025})`,
          }}
        />
      ))}
    </div>
  )
}

function Sphere({ size, tone }: { size: number; tone: Tone }) {
  return (
    <span
      className="block rounded-full"
      style={{
        width: size,
        height: size,
        background:
          tone === 'dark'
            ? 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85) 0%, rgba(120,170,230,0.45) 18%, rgba(23,58,94,0.6) 55%, rgba(5,13,26,0.2) 100%)'
            : 'radial-gradient(circle at 32% 28%, #ffffff 0%, #e8eef7 25%, #b7c7dc 62%, #8ea4c0 100%)',
        boxShadow: tone === 'dark' ? '0 30px 60px -20px rgba(0,0,0,0.6)' : '0 30px 50px -25px rgba(15,39,66,0.35)',
      }}
    />
  )
}

function Prism({ size, tone }: { size: number; tone: Tone }) {
  // Dreiseitiges Prisma aus drei Flächen
  const w = size
  const h = size * 1.2
  const apothem = w / (2 * Math.tan(Math.PI / 3))
  return (
    <div className="f3d-spin-slow relative" style={{ width: w, height: h }}>
      {[0, 120, 240].map((deg) => (
        <span
          key={deg}
          className={cn(
            'absolute inset-0 border',
            tone === 'dark' ? 'border-white/20 bg-gradient-to-b from-sky-600/25 to-white/[0.03]' : 'border-navy-800/10 bg-gradient-to-b from-sky-100/80 to-white/30',
          )}
          style={{ transform: `rotateY(${deg}deg) translateZ(${apothem}px)` }}
        />
      ))}
    </div>
  )
}

function LogoTile({ size, tone }: { size: number; tone: Tone }) {
  const depth = 10
  return (
    <div className="f3d-sway relative" style={{ width: size, height: size }}>
      {Array.from({ length: depth }).map((_, i) => {
        const front = i === depth - 1
        return (
          <span
            key={i}
            className="absolute inset-0 grid place-items-center rounded-[24%]"
            style={{
              transform: `translateZ(${i * 2.4}px)`,
              background: front ? (tone === 'dark' ? 'linear-gradient(145deg,#1d4a75,#0f2742)' : 'linear-gradient(145deg,#1d3f63,#0f2742)') : '#0a1a2f',
              boxShadow: front ? 'inset 0 1px 0 rgba(255,255,255,0.25)' : undefined,
            }}
          >
            {front && (
              <svg viewBox="0 0 32 32" className="size-[70%]" aria-hidden="true">
                <path d="M5 23h7l8-12h7" fill="none" stroke="#e30613" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="27" cy="11" r="2.6" fill="#ffffff" />
              </svg>
            )}
          </span>
        )
      })}
    </div>
  )
}

interface Item {
  node: ReactNode
  style: CSSProperties
  depth: number // Parallax-Stärke
  float: number // Dauer der Schwebebewegung (s)
}

export function Floating3D({ tone = 'light', className, dense = false }: { tone?: Tone; className?: string; dense?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5
      ty = e.clientY / window.innerHeight - 0.5
    }
    const tick = () => {
      x += (tx - x) * 0.04
      y += (ty - y) * 0.04
      el.style.setProperty('--px', x.toFixed(4))
      el.style.setProperty('--py', y.toFixed(4))
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  const items: Item[] = [
    { node: <LogoTile size={dense ? 130 : 110} tone={tone} />, style: { right: '3%', top: '7%' }, depth: 60, float: 9 },
    { node: <Cube size={dense ? 110 : 90} tone={tone} />, style: { left: '6%', top: '58%' }, depth: 40, float: 11 },
    { node: <Ring size={dense ? 170 : 140} tone={tone} />, style: { left: '2%', top: '20%' }, depth: 30, float: 13 },
    { node: <Sphere size={dense ? 120 : 96} tone={tone} />, style: { right: '18%', bottom: '6%' }, depth: 70, float: 10 },
    { node: <Prism size={dense ? 70 : 56} tone={tone} />, style: { left: '24%', bottom: '14%' }, depth: 50, float: 12 },
    { node: <Cube size={dense ? 54 : 44} tone={tone} accent />, style: { right: '38%', top: '42%' }, depth: 90, float: 8 },
    { node: <Sphere size={dense ? 40 : 32} tone={tone} />, style: { left: '30%', top: '6%' }, depth: 100, float: 7 },
  ]

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden [perspective:1200px]', tone === 'light' ? 'opacity-70' : 'opacity-90', className)}
      style={{ '--px': 0, '--py': 0 } as CSSProperties}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className="absolute [transform-style:preserve-3d]"
          style={{
            ...it.style,
            transform: `translate3d(calc(var(--px) * ${it.depth}px), calc(var(--py) * ${it.depth}px), 0)`,
          }}
        >
          <div className="f3d-float [transform-style:preserve-3d]" style={{ animationDuration: `${it.float}s`, animationDelay: `${-i * 1.7}s` }}>
            {it.node}
          </div>
        </div>
      ))}
    </div>
  )
}
