import * as React from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  trend = 'up',
  progress,
  className,
  index = 0,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  delta?: string
  trend?: 'up' | 'down' | 'neutral'
  progress?: number
  className?: string
  index?: number
}) {
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Card className={cn('lift p-6', className)}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-medium tracking-[-0.005em] text-muted-foreground">{label}</p>
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-b from-navy-50 to-navy-100/70 text-navy-800 ring-1 ring-black/[0.04]">
            <Icon className="size-4" />
          </span>
        </div>
        <p className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.04em] text-foreground tabular">{value}</p>
        {progress !== undefined && <Progress value={progress} className="mt-3" label={label} />}
        {delta && (
          <p
            className={cn(
              'mt-3 flex items-center gap-1 text-xs font-medium',
              trend === 'down' ? 'text-danger' : trend === 'neutral' ? 'text-muted-foreground' : 'text-success',
            )}
          >
            {trend !== 'neutral' && <TrendIcon className="size-3.5" />}
            {delta}
          </p>
        )}
      </Card>
    </motion.div>
  )
}
