import { formatNumber } from '@/lib/utils'

interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

/** Einheitlicher Tooltip für alle Recharts-Diagramme. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-36 rounded-md border border-border bg-white px-3 py-2 text-xs shadow-pop">
      {label !== undefined && label !== '' && <p className="mb-1.5 font-semibold text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-foreground tabular">
              {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const CHART_COLORS = {
  navy: '#12345A',
  brand: '#0076A8',
  brandLight: '#5BB4DB',
  red: '#E30613',
  slate: '#94A3B8',
  success: '#16866A',
  warning: '#D97706',
  danger: '#B91C1C',
  grid: '#E2E8F0',
  axis: '#64748B',
}
