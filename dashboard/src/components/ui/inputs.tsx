import * as React from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-xl border border-transparent bg-black/[0.04] text-sm text-foreground transition-all placeholder:text-slate-500 hover:bg-black/[0.055] focus-visible:outline-none focus-visible:border-sky-600/40 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-sky-600/12 disabled:cursor-not-allowed disabled:opacity-60'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldBase, 'h-10 px-3.5', className)} {...props} />,
)
Input.displayName = 'Input'

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { wrapperClassName?: string; shortcut?: string }
>(({ className, wrapperClassName, shortcut, ...props }, ref) => (
  <div className={cn('relative', wrapperClassName)}>
    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    <input
      ref={ref}
      type="search"
      className={cn(fieldBase, 'h-10 rounded-full pl-10 pr-4', shortcut && 'pr-14', className)}
      {...props}
    />
    {shortcut && (
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md bg-white/80 px-1.5 text-[10.5px] ring-1 ring-black/[0.06] font-medium text-slate-500 sm:block">
        {shortcut}
      </kbd>
    )}
  </div>
))
SearchInput.displayName = 'SearchInput'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'min-h-20 resize-none px-3 py-2 leading-relaxed', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, 'h-10 appearance-none pl-3.5 pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  ),
)
NativeSelect.displayName = 'NativeSelect'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-[13px] font-medium text-foreground', className)} {...props} />
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean
  onCheckedChange: (value: boolean) => void
  label: string
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        checked ? 'bg-brand' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
