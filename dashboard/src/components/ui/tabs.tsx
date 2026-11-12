import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('Tabs-Komponenten müssen innerhalb von <Tabs> verwendet werden')
  return ctx
}

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="tablist" className={cn('inline-flex items-center gap-0.5 rounded-full bg-black/[0.05] p-[3px]', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  icon: Icon,
  children,
  className,
}: {
  value: string
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  const ctx = useTabs()
  const active = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30',
        active ? 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.1),0_0_0_0.5px_rgba(0,0,0,0.04)]' : 'text-slate-600 hover:text-foreground',
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useTabs()
  if (ctx.value !== value) return null
  return (
    <div key={value} role="tabpanel" className={cn('tab-enter', className)}>
      {children}
    </div>
  )
}
