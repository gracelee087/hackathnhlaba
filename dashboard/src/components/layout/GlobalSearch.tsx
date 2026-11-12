import type * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, GraduationCap, Library, CornerDownLeft } from 'lucide-react'
import { SearchInput } from '@/components/ui/inputs'
import { StatusBadge } from '@/components/ui/status-badge'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

interface Result {
  id: string
  group: 'Wissensartikel' | 'Dokumente' | 'Kurse'
  title: string
  subtitle: string
  path: string
  icon: React.ElementType
  node?: React.ReactNode
}

export function GlobalSearch({ className }: { className?: string }) {
  const { state } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const articles: Result[] = state.articles
      .filter((a) => `${a.title} ${a.description} ${a.tags.join(' ')}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((a) => ({ id: a.id, group: 'Wissensartikel', title: a.title, subtitle: a.category, path: `/knowledge-base/${a.id}`, icon: Library, node: <StatusBadge status={a.status} /> }))
    const docs: Result[] = state.documents
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((d) => ({ id: d.id, group: 'Dokumente', title: d.name, subtitle: d.department, path: '/documents', icon: FileText }))
    const courses: Result[] = state.modules
      .filter((m) => m.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((m) => ({ id: m.id, group: 'Kurse', title: m.title, subtitle: `${m.level} · ${m.durationMin} Min.`, path: `/learning/${m.id}`, icon: GraduationCap }))
    return [...articles, ...docs, ...courses]
  }, [query, state.articles, state.documents, state.modules])

  useEffect(() => setActive(0), [query])

  const go = (r: Result) => {
    navigate(r.path)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      if (results[active]) go(results[active])
      else if (query.trim()) {
        navigate('/knowledge-base', { state: { query: query.trim() } })
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const groups = ['Wissensartikel', 'Dokumente', 'Kurse'] as const

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <SearchInput
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Wissen, Dokumente, Kurse suchen…"
        aria-label="Globale Suche"
        shortcut="⌘K"
        className="bg-slate-50 focus-visible:bg-white"
      />
      <AnimatePresence>
        {open && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-[60] mt-2 max-h-[420px] overflow-y-auto rounded-lg border border-border bg-white p-1.5 shadow-pop scrollbar-thin"
          >
            {results.length === 0 ? (
              <div className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                Keine Treffer für „{query}“.
                <button
                  type="button"
                  className="mt-2 block w-full text-[12.5px] font-semibold text-brand hover:underline"
                  onClick={() => {
                    navigate('/assistant', { state: { question: query } })
                    setOpen(false)
                  }}
                >
                  Den KI-Assistenten fragen
                </button>
              </div>
            ) : (
              groups.map((g) => {
                const items = results.filter((r) => r.group === g)
                if (!items.length) return null
                return (
                  <div key={g} className="py-1">
                    <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{g}</p>
                    {items.map((r) => {
                      const idx = results.indexOf(r)
                      const Icon = r.icon
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go(r)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
                            idx === active ? 'bg-slate-100' : 'hover:bg-slate-50',
                          )}
                        >
                          <Icon className="size-4 shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-foreground">{r.title}</span>
                            <span className="block truncate text-[11.5px] text-muted-foreground">{r.subtitle}</span>
                          </span>
                          {r.node}
                          {idx === active && <CornerDownLeft className="size-3.5 text-slate-400" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
