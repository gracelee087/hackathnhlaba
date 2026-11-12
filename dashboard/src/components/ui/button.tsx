import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-[-0.01em] transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-navy-900 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-navy-700',
        brand: 'bg-brand text-white shadow-[0_6px_20px_-8px_rgba(227,6,19,0.6)] hover:bg-brand-600',
        secondary: 'bg-black/[0.05] text-foreground hover:bg-black/[0.08]',
        outline: 'border border-black/[0.08] bg-white/80 text-foreground shadow-xs backdrop-blur hover:bg-white hover:border-black/[0.14]',
        ghost: 'text-foreground hover:bg-black/[0.05]',
        destructive: 'bg-danger text-white shadow-sm hover:bg-danger/90',
        link: 'h-auto px-0 text-sky-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3.5 text-[13px]',
        xs: 'h-7 gap-1.5 px-3 text-xs',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
