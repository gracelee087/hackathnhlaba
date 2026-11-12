import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium leading-4 [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-navy-800 text-white',
        secondary: 'border-transparent bg-slate-100 text-slate-700',
        outline: 'border-border bg-white text-foreground',
        brand: 'border-brand/20 bg-brand-50 text-brand-700',
        success: 'border-success/25 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        danger: 'border-danger/25 bg-danger/10 text-danger',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
