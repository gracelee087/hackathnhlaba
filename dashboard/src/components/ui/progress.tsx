import type * as React from 'react'
import { cn, clamp } from '@/lib/utils'

export function Progress({
  value,
  className,
  indicatorClassName,
  label,
}: {
  value: number
  className?: string
  indicatorClassName?: string
  label?: string
}) {
  const v = clamp(value, 0, 100)
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}
    >
      <div
        className={cn('h-full rounded-full bg-brand transition-[width] duration-500 ease-out', indicatorClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 72,
  stroke = 6,
  className,
  colorClassName = 'text-brand',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  colorClassName?: string
  children?: React.ReactNode
}) {
  const v = clamp(value, 0, 100)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', colorClassName)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
