import * as React from 'react'
import { cn } from '@/lib/utils'

export function Avatar({
  initials,
  className,
  tone = 'navy',
}: {
  initials: string
  className?: string
  tone?: 'navy' | 'brand' | 'slate'
}) {
  const tones = {
    navy: 'bg-navy-800 text-white',
    brand: 'bg-brand-100 text-brand-700',
    slate: 'bg-slate-200 text-slate-700',
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid size-8 shrink-0 select-none place-items-center rounded-full text-[11.5px] font-semibold',
        tones[tone],
        className,
      )}
    >
      {initials}
    </span>
  )
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? 'h-full w-px' : 'h-px w-full', 'bg-border', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} />
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="grid size-11 place-items-center rounded-lg border border-border bg-white text-slate-400 shadow-card">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Aufwärts-Motiv: kleine, nach rechts oben steigende Akzentlinie in Rot. */
export function RisingMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 12" className={cn('h-3 w-11 text-brand', className)} aria-hidden="true">
      <path d="M1 11 L15 11 L27 2 L43 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-[3px] w-8 rounded-full bg-gradient-to-r from-brand to-brand-300" aria-hidden="true" />
          {eyebrow && <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">{eyebrow}</span>}
        </div>
        <h1 className="font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[38px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function DemoBadge({ className, label = 'Demo · simulierte KI' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-600',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-brand" />
      {label}
    </span>
  )
}

export function KeyValue({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2 text-[13px]', className)}>
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">{children}</dd>
    </div>
  )
}

/** Klar benannter Seitenabschnitt – sorgt für eine ruhige, übersichtliche Struktur. */
export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-[21px] font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-[14px] text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}
