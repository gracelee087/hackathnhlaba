import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, List, SearchX, FilterX, Plus } from 'lucide-react'
import type { Category, Department, ValidityStatus } from '@/types'
import { PageHeader, EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NativeSelect, SearchInput } from '@/components/ui/inputs'
import { Segmented } from '@/components/ui/segmented'
import { StatusBadge, VerificationBadge } from '@/components/ui/status-badge'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ArticleCard, OriginIcon } from '@/components/knowledge/KnowledgeComponents'
import { useApp } from '@/context/AppContext'
import { CATEGORIES, DEPARTMENTS } from '@/data/mock-data'
import { STATUS_META, STATUS_ORDER, isHistoric } from '@/lib/validity'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import { useMetrics } from '@/hooks/useMetrics'

export default function KnowledgeBasePage() {
  const { state } = useApp()
  const metrics = useMetrics()
  const location = useLocation()
  const navigate = useNavigate()
  const initialQuery = (location.state as { query?: string } | null)?.query ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<'alle' | Category>('alle')
  const [department, setDepartment] = useState<'alle' | Department>('alle')
  const [status, setStatus] = useState<'alle' | ValidityStatus>('alle')
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.articles
      .filter(
        (a) =>
          (category === 'alle' || a.category === category) &&
          (department === 'alle' || a.department === department) &&
          (status === 'alle' || a.status === status) &&
          (!q || `${a.title} ${a.description} ${a.tags.join(' ')} ${a.expert} ${a.content.join(' ')}`.toLowerCase().includes(q)),
      )
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || b.updatedAt.localeCompare(a.updatedAt))
  }, [state.articles, query, category, department, status])

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: state.articles.length }
    STATUS_ORDER.forEach((s) => (c[s] = state.articles.filter((a) => a.status === s).length))
    return c
  }, [state.articles])

  const hasFilters = query || category !== 'alle' || department !== 'alle' || status !== 'alle'
  const reset = () => {
    setQuery('')
    setCategory('alle')
    setDepartment('alle')
    setStatus('alle')
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge Base"
        description="Das zentrale Gedächtnis der Organisation."
        eyebrow={`${formatNumber(metrics.articles)} Wissensartikel organisationsweit · ${state.articles.length} in dieser Demo`}
        actions={
          <Button onClick={() => navigate('/documents')}>
            <Plus /> Wissen hinzufügen
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            wrapperClassName="flex-1"
            placeholder="Titel, Inhalte, Schlagwörter oder Expert:innen durchsuchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Knowledge Base durchsuchen"
          />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <NativeSelect value={category} onChange={(e) => setCategory(e.target.value as typeof category)} aria-label="Kategorie filtern" className="sm:w-44">
              <option value="alle">Alle Kategorien</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </NativeSelect>
            <NativeSelect value={department} onChange={(e) => setDepartment(e.target.value as typeof department)} aria-label="Abteilung filtern" className="sm:w-52">
              <option value="alle">Alle Abteilungen</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </NativeSelect>
          </div>
          <Segmented
            ariaLabel="Ansicht wählen"
            value={view}
            onChange={setView}
            size="md"
            options={[
              { value: 'grid', label: 'Raster', icon: LayoutGrid },
              { value: 'table', label: 'Tabelle', icon: List },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {(['alle', ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
                status === s ? 'border-navy-800 bg-navy-800 text-white' : 'border-border bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              {s !== 'alle' && <span className={cn('size-1.5 rounded-full', STATUS_META[s].dot)} />}
              {s === 'alle' ? 'Alle' : STATUS_META[s].label}
              <span className={cn('tabular', status === s ? 'text-white/70' : 'text-slate-400')}>{counts[s]}</span>
            </button>
          ))}
          {hasFilters && (
            <Button size="xs" variant="ghost" onClick={reset} className="ml-auto text-muted-foreground">
              <FilterX /> Filter zurücksetzen
            </Button>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="Keine Wissensartikel gefunden"
            description="Passen Sie Suche oder Filter an – oder fragen Sie den KI-Assistenten."
            action={<Button variant="outline" onClick={reset}>Filter zurücksetzen</Button>}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Titel</TH>
                <TH>Kategorie</TH>
                <TH className="hidden lg:table-cell">Abteilung</TH>
                <TH>Gültig ab</TH>
                <TH>Gültig bis</TH>
                <TH>Status</TH>
                <TH className="hidden md:table-cell">Verifizierung</TH>
                <TH className="hidden xl:table-cell">Aktualisiert</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((a) => (
                <TR
                  key={a.id}
                  onClick={() => navigate(`/knowledge-base/${a.id}`)}
                  className={cn('cursor-pointer hover:bg-slate-50', isHistoric(a.status) && 'bg-slate-50/70 text-slate-500')}
                >
                  <TD className="max-w-[320px]">
                    <p className={cn('truncate font-medium', isHistoric(a.status) ? 'text-slate-500' : 'text-foreground', a.status === 'veraltet' && 'line-through')}>{a.title}</p>
                    <OriginIcon origin={a.origin} />
                  </TD>
                  <TD>{a.category}</TD>
                  <TD className="hidden text-muted-foreground lg:table-cell">{a.department}</TD>
                  <TD className="whitespace-nowrap tabular">{formatDate(a.validFrom)}</TD>
                  <TD className="whitespace-nowrap tabular">{formatDate(a.validUntil)}</TD>
                  <TD><StatusBadge status={a.status} /></TD>
                  <TD className="hidden md:table-cell"><VerificationBadge value={a.verification} /></TD>
                  <TD className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{formatDate(a.updatedAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
