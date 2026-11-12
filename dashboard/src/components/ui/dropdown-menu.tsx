import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode
  children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode)
  align?: 'start' | 'end'
  className?: string
}

export function DropdownMenu({ trigger, children, align = 'end', className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const close = React.useCallback(() => setOpen(false), [])

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute z-[60] mt-2 min-w-52 rounded-lg border border-border bg-white p-1 shadow-pop',
              align === 'end' ? 'right-0' : 'left-0',
              className,
            )}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownItem({
  icon: Icon,
  children,
  onSelect,
  danger,
  hint,
}: {
  icon?: React.ElementType
  children: React.ReactNode
  onSelect: () => void
  danger?: boolean
  hint?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none',
        danger ? 'text-danger' : 'text-foreground',
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 text-slate-500" />}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </button>
  )
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</div>
}
