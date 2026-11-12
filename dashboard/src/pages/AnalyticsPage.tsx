import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BookOpenCheck, CalendarDays, FileSearch, GraduationCap, Library, MessagesSquare, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/ui/misc'
import { Card, SectionHeader } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { StatCard } from '@/components/ui/stat-card'
import { CHART_COLORS, ChartTooltip } from '@/components/ui/chart-tooltip'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/context/AppContext'
import { useMetrics } from '@/hooks/useMetrics'
import { DEPARTMENT_STATS } from '@/data/mock-data'
import { buildTimeSeries, type DateRange } from '@/lib/analytics'
import { STATUS_META, STATUS_ORDER } from '@/lib/validity'
import { cn, formatNumber } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  aktuell: CHART_COLORS.success,
  pruefung: CHART_COLORS.warning,
  historisch: CHART_COLORS.slate,
  veraltet: CHART_COLORS.danger,
}

const RANGE_LABEL: Record<DateRange, string> = { '30d': 'letzte 30 Tage', '90d': 'letzte 90 Tage', '12m': 'letzte 12 Monate' }

export default function AnalyticsPage() {
  const { state } = useApp()
  const m = useMetrics()
  const [range, setRange] = useState<DateRange>('12m')
  const [deptMetric, setDeptMetric] = useState<'coverage' | 'completion'>('coverage')

  const series = useMemo(() => buildTimeSeries(range, m.growth), [range, m.growth])
  const factor = range === '30d' ? 0.12 : range === '90d' ? 0.32 : 1

  const statusData = STATUS_ORDER.map((s) => ({
    name: STATUS_META[s].label,
    key: s,
    value: state.articles.filter((a) => a.status === s).length,
  })).filter((d) => d.value > 0)

  const learningData = [
    { name: 'Abgeschlossen', value: m.learning.completedModules, color: CHART_COLORS.success },
    { name: 'In Bearbeitung', value: m.learning.inProgress, color: CHART_COLORS.brand },
    { name: 'Nicht begonnen', value: m.learning.notStarted, color: '#CBD5E1' },
  ].filter((d) => d.value > 0)

  const kpis = [
    { label: 'Erfasstes Wissen', value: formatNumber(m.articles), icon: Library, delta: `+${formatNumber(Math.round(582 * factor) + m.newArticles)} im Zeitraum` },
    { label: 'Dokumente analysiert', value: formatNumber(m.documentsAnalyzed), icon: FileSearch, delta: `+${Math.round(208 * factor) + m.newDocs} im Zeitraum` },
    { label: 'Abgeschlossene Interviews', value: formatNumber(m.interviewsCompleted), icon: MessagesSquare, delta: `+${Math.max(1, Math.round(52 * factor))} im Zeitraum` },
    { label: 'Generierte Lernmodule', value: formatNumber(m.activeModules), icon: GraduationCap, delta: `+${Math.max(1, Math.round(17 * factor)) + m.newModules} im Zeitraum` },
    { label: 'Lernabschlussquote', value: `${m.learning.completionRate} %`, icon: BookOpenCheck, progress: m.learning.completionRate, delta: `${m.learning.completedChapters} von ${m.learning.totalChapters} Kapiteln` },
    { label: 'Offene Wissenslücken', value: m.knowledgeGaps, icon: TriangleAlert, trend: 'down' as const, delta: `${m.openContradictions} Widersprüche zu prüfen` },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Kennzahlen zu Wissenssicherung, Lernfortschritt und Wissenslücken."
        actions={
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-slate-400" />
            <Segmented
              ariaLabel="Zeitraum"
              size="md"
              value={range}
              onChange={setRange}
              options={[
                { value: '30d', label: '30 Tage' },
                { value: '90d', label: '90 Tage' },
                { value: '12m', label: '12 Monate' },
              ]}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((k, i) => (
          <StatCard key={k.label} index={i} label={k.label} value={k.value} icon={k.icon} delta={k.delta} trend={k.trend ?? 'up'} progress={k.progress} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionHeader title="Wissensaufbau im Zeitverlauf" description={`Wissensartikel und analysierte Dokumente · ${RANGE_LABEL[range]}`} />
          <div className="h-[300px] px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: CHART_COLORS.axis }} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} width={44} tick={{ fontSize: 11.5, fill: CHART_COLORS.axis }} tickFormatter={(v: number) => formatNumber(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="articles" name="Wissensartikel" stroke={CHART_COLORS.navy} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="documents" name="Dokumente" stroke={CHART_COLORS.brand} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Status der Wissensartikel" description="Gültigkeitsstatus in der Knowledge Base (live)" />
          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} strokeWidth={0}>
                  {statusData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular">{state.articles.length}</p>
                <p className="text-[11px] text-muted-foreground">Artikel (Demo)</p>
              </div>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2 px-5 pb-5">
            {statusData.map((d) => (
              <li key={d.key} className="flex items-center gap-2 text-[12px]">
                <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.key] }} />
                <span className="flex-1 text-muted-foreground">{d.name}</span>
                <span className="font-semibold tabular">{d.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionHeader
            title="Abteilungsvergleich"
            description="Wissensabdeckung bzw. Lernabschlussquote je Abteilung"
            action={
              <Segmented
                ariaLabel="Kennzahl"
                value={deptMetric}
                onChange={setDeptMetric}
                options={[
                  { value: 'coverage', label: 'Abdeckung' },
                  { value: 'completion', label: 'Lernquote' },
                ]}
              />
            }
          />
          <div className="h-[280px] px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPARTMENT_STATS} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barSize={28}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="short" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: CHART_COLORS.axis }} />
                <YAxis tickLine={false} axisLine={false} width={36} domain={[0, 100]} tick={{ fontSize: 11.5, fill: CHART_COLORS.axis }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip content={<ChartTooltip unit=" %" />} cursor={{ fill: 'rgba(18,52,90,0.04)' }} />
                <Bar dataKey={deptMetric} name={deptMetric === 'coverage' ? 'Wissensabdeckung' : 'Lernabschlussquote'} radius={[4, 4, 0, 0]} animationDuration={500}>
                  {DEPARTMENT_STATS.map((d) => (
                    <Cell key={d.department} fill={d[deptMetric] < 75 ? CHART_COLORS.warning : CHART_COLORS.navy} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Lernfortschritt" description="Status aller Kurse (live)" />
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={learningData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                  {learningData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular">{m.learning.completionRate}%</p>
                <p className="text-[11px] text-muted-foreground">Abschlussquote</p>
              </div>
            </div>
          </div>
          <ul className="space-y-2 px-5 pb-5">
            {learningData.map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-[12px]">
                <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="flex-1 text-muted-foreground">{d.name}</span>
                <span className="font-semibold tabular">{d.value} Kurse</span>
              </li>
            ))}
            <li className="flex items-center gap-2 border-t border-border pt-2 text-[12px]">
              <span className="flex-1 text-muted-foreground">Ø Quiz-Score</span>
              <span className="font-semibold tabular">{m.learning.avgScore} %</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <SectionHeader title="Wissenslücken nach Abteilung" description="Priorisierung für Experteninterviews und Dokumentanalyse" />
        <div className="mt-4 border-t border-border">
          <Table>
            <THead>
              <TR>
                <TH>Abteilung</TH>
                <TH>Wissensartikel</TH>
                <TH>Offene Lücken</TH>
                <TH className="w-56">Wissensabdeckung</TH>
                <TH>Risiko</TH>
              </TR>
            </THead>
            <TBody>
              {[...DEPARTMENT_STATS].sort((a, b) => b.gaps - a.gaps).map((d) => {
                const risk = d.gaps >= 6 ? 'Hoch' : d.gaps >= 4 ? 'Mittel' : 'Niedrig'
                return (
                  <TR key={d.department} className="hover:bg-slate-50">
                    <TD className="font-medium">{d.department}</TD>
                    <TD className="tabular">{formatNumber(d.articles)}</TD>
                    <TD className="tabular">{d.gaps}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <Progress value={d.coverage} className="h-1.5" indicatorClassName={d.coverage < 80 ? 'bg-warning' : 'bg-navy-800'} label={`Abdeckung ${d.department}`} />
                        <span className="w-10 text-right text-[12px] tabular">{d.coverage} %</span>
                      </div>
                    </TD>
                    <TD>
                      <span
                        className={cn(
                          'inline-flex rounded-md px-2 py-0.5 text-[11.5px] font-semibold',
                          risk === 'Hoch' && 'bg-danger/10 text-danger',
                          risk === 'Mittel' && 'bg-warning/10 text-warning',
                          risk === 'Niedrig' && 'bg-success/10 text-success',
                        )}
                      >
                        {risk}
                      </span>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
