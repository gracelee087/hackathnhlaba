import { BadgeCheck, Clock, ShieldQuestion } from 'lucide-react'
import type { ValidityStatus, VerificationStatus } from '@/types'
import { STATUS_META, VERIFICATION_META } from '@/lib/validity'
import { cn } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: ValidityStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span
      title={meta.hint}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11.5px] font-medium leading-4',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function VerificationBadge({ value, className }: { value: VerificationStatus; className?: string }) {
  const meta = VERIFICATION_META[value]
  const Icon = value === 'verifiziert' ? BadgeCheck : value === 'in_pruefung' ? Clock : ShieldQuestion
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', meta.className, className)}>
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  )
}
