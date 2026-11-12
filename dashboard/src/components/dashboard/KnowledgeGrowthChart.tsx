import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { CHART_COLORS, ChartTooltip } from '@/components/ui/chart-tooltip'
import type { GrowthPoint } from '@/lib/analytics'
import { formatNumber } from '@/lib/utils'

type Metric = 'articles' | 'documents' | 'interviews'

const METRICS: Record<Metric, { label: string; color: string }> = {
  articles: { label: 'Wissensartikel', color: CHART_COLORS.navy },
  documents: { label: 'Dokumente analysiert', color: CHART_COLORS.brand },
  interviews: { label: 'Experteninterviews', color: CHART_COLORS.success },
}

export function KnowledgeGrowthChart({ data }: { data: GrowthPoint[] }) {
  const [metric, setMetric] = useState<Metric>('articles')
  const first = data[0]?.[metric] ?? 0
  const last = data[data.length - 1]?.[metric] ?? 0
  const growth = metric === 'interviews' ? data.reduce((s, d) => s + d.interviews, 0) : last - first
  const color = METRICS[metric].color

  return (
    <Card className="h-full">
      <SectionHeader
        title="Knowledge Growth"
        description="Entwicklung des erfassten Wissens in den letzten 12 Monaten"
        action={
          <Segmented
            ariaLabel="Kennzahl wählen"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'articles', label: 'Artikel' },
              { value: 'documents', label: 'Dokumente' },
              { value: 'interviews', label: 'Interviews' },
            ]}
          />
        }
      />
      <div className="flex items-baseline gap-3 px-5 pt-4">
        <span className="text-2xl font-semibold tracking-tight tabular">{formatNumber(metric === 'interviews' ? growth : last)}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-success">
          <TrendingUp className="size-3.5" />
          {metric === 'interviews' ? 'Interviews in 12 Monaten' : `+${formatNumber(growth)} seit ${data[0]?.month ?? ''}`}
        </span>
      </div>
      <div className="h-[260px] px-2 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART_COLORS.axis }} />
            <YAxis tickLine={false} axisLine={false} width={44} tick={{ fontSize: 12, fill: CHART_COLORS.axis }} tickFormatter={(v: number) => formatNumber(v)} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_COLORS.slate, strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey={metric}
              name={METRICS[metric].label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${metric})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
