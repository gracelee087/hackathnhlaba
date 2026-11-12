import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: React.ElementType
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'sm',
  ariaLabel,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
  ariaLabel?: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex rounded-full bg-black/[0.05] p-[3px]', className)}>
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30',
              size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-3.5 text-[13px]',
              active ? 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.1),0_0_0_0.5px_rgba(0,0,0,0.04)]' : 'text-slate-600 hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
