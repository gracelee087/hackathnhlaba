import type * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Hintergrundmotiv: aufsteigende Linien – „nach vorne und nach oben“. */
export function RisingPattern({ className }: { className?: string }) {
  const lines = [0, 1, 2, 3, 4, 5]
  return (
    <svg viewBox="0 0 600 260" preserveAspectRatio="xMaxYMid slice" className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} aria-hidden="true">
      {lines.map((i) => {
        const y = 250 - i * 34
        return (
          <path
            key={i}
            d={`M ${-20 + i * 30} ${y} L ${180 + i * 30} ${y} L ${300 + i * 30} ${y - 90} L 640 ${y - 90}`}
            fill="none"
            stroke="white"
            strokeOpacity={0.035 + i * 0.01}
            strokeWidth={1.5}
          />
        )
      })}
      <motion.path
        d="M 260 258 L 420 258 L 520 168 L 640 168"
        fill="none"
        stroke="#ff5a63"
        strokeWidth={3}
        strokeLinecap="square"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  )
}

export interface HeroStat {
  label: string
  value: React.ReactNode
  hint?: string
}

export function HeroBanner({
  eyebrow,
  title,
  subtitle,
  actions,
  stats,
}: {
  eyebrow?: React.ReactNode
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  stats?: HeroStat[]
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-[28px] bg-navy-950 text-white shadow-soft ring-1 ring-white/5"
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_0%,#173a5e_0%,#0a1a2f_45%,#050d1a_100%)]" />
      <div className="drift-a pointer-events-none absolute -left-24 -top-32 size-[28rem] rounded-full bg-sky-600/25 blur-[90px]" aria-hidden="true" />
      <div className="drift-b pointer-events-none absolute -bottom-40 right-0 size-[30rem] rounded-full bg-brand/25 blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" aria-hidden="true" />
      <RisingPattern />
      <div className="relative grid gap-10 p-7 sm:p-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-end">
        <div className="min-w-0">
          {eyebrow && (
            <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-[12px] font-medium text-white/80 ring-1 ring-white/10 backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand-300 shadow-[0_0_10px_2px_rgba(255,90,99,0.6)]" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-4 font-display text-[36px] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-[48px]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white/65">{subtitle}</p>}
          {actions && <div className="mt-7 flex flex-wrap gap-2.5">{actions}</div>}
        </div>
        {stats && stats.length > 0 && (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/[0.06] px-5 py-4 ring-1 ring-white/10 backdrop-blur-xl">
                <dt className="text-[11.5px] font-medium tracking-[0.02em] text-white/55">{s.label}</dt>
                <dd className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular">{s.value}</dd>
                {s.hint && <p className="mt-2 text-[11.5px] text-white/45">{s.hint}</p>}
              </div>
            ))}
          </dl>
        )}
      </div>
    </motion.section>
  )
}
