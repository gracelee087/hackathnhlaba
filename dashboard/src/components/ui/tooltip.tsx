import * as React from 'react'
import { cn } from '@/lib/utils'

const sideClasses = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  right: 'left-full top-1/2 ml-3 -translate-y-1/2',
  left: 'right-full top-1/2 mr-3 -translate-y-1/2',
} as const

/** Leichtgewichtiger, CSS-basierter Tooltip (Hover & Tastaturfokus). */
export function Tooltip({
  content,
  side = 'top',
  disabled,
  className,
  children,
}: {
  content: React.ReactNode
  side?: keyof typeof sideClasses
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  if (disabled) return <>{children}</>
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-[70] whitespace-nowrap rounded-md bg-navy-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-pop transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          sideClasses[side],
        )}
      >
        {content}
      </span>
    </span>
  )
}
