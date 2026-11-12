import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[22px] border border-black/[0.05] bg-card shadow-card', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 px-6 pt-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[16px] font-semibold tracking-[-0.02em] text-foreground', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[13px] text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pb-6 pt-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 border-t border-black/[0.05] px-6 py-3.5', className)} {...props} />
}

/** Kompakter Kartenkopf mit Titel, Beschreibung und optionaler Aktion rechts. */
export function SectionHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ElementType
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-6 pt-6', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-navy-50 to-navy-100/70 text-navy-800 ring-1 ring-black/[0.04]">
            <Icon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
