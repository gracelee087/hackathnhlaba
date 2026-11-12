import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { BOTTOM_NAV, MAIN_NAV, NAV_GROUPS, type NavItem } from '@/components/navigation/nav-items'
import { RisingMark } from '@/components/ui/misc'
import { Tooltip } from '@/components/ui/tooltip'
import { Avatar } from '@/components/ui/misc'
import { useMetrics } from '@/hooks/useMetrics'
import { useApp } from '@/context/AppContext'
import { ROLE_LABELS } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Logo, ProjectMark } from '@/components/brand/Logo'

export function BrandMark({ className }: { className?: string }) {
  return <ProjectMark className={className} />
}

interface SidebarProps {
  collapsed: boolean
  onToggle?: () => void
  mobile?: boolean
}

export function Sidebar({ collapsed, onToggle, mobile = false }: SidebarProps) {
  const metrics = useMetrics()
  const { user: currentUser, can, state } = useApp()
  const badges: Record<NonNullable<NavItem['badgeKey']>, number> = {
    interviews: metrics.activeInterviews,
    review: metrics.reviewNeeded,
    leaving: metrics.workforce.austritt_geplant,
    reviews: state.reviews.filter((r) => r.status === 'offen' && (can('board.allDepartments') || r.department === currentUser.department)).length,
  }

  const renderItem = (item: NavItem) => {
    const Icon = item.icon
    const badge = item.badgeKey ? badges[item.badgeKey] : 0
    return (
      <li key={item.path}>
        <Tooltip content={item.label} side="right" disabled={!collapsed} className="flex w-full">
          <NavLink
            to={item.path}
            end={item.path === '/dashboard'}
            aria-label={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex h-9 w-full items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.05)]'
                  : 'text-slate-600 hover:bg-black/[0.045] hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={mobile ? 'nav-active-mobile' : 'nav-active'}
                    className="absolute inset-y-2.5 left-1 w-[3px] rounded-full bg-brand"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className={cn('size-[18px] shrink-0 transition-colors', isActive ? 'text-brand' : 'text-slate-500 group-hover:text-foreground')} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {badge > 0 &&
                  (collapsed ? (
                    <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand" />
                  ) : (
                    <span
                      className={cn(
                        'min-w-5 rounded-full px-1.5 text-center text-[10.5px] font-semibold leading-[18px] tabular',
                        item.badgeKey === 'reviews' ? 'bg-brand text-white' : 'bg-black/[0.06] text-slate-600',
                      )}
                    >
                      {badge}
                    </span>
                  ))}
              </>
            )}
          </NavLink>
        </Tooltip>
      </li>
    )
  }

  return (
    <aside
      className={cn(
        'glass flex h-full flex-col border-r border-black/[0.06] text-foreground transition-[width] duration-300 ease-out',
        mobile ? 'w-72' : collapsed ? 'w-[68px]' : 'w-64',
      )}
      aria-label="Seitenleiste"
    >
      <div className={cn('flex h-[68px] shrink-0 items-center gap-3', collapsed ? 'justify-center px-2' : 'px-5')}>
        <NavLink to="/" aria-label="Zur Startseite" className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30">
          <Logo compact={collapsed} />
        </NavLink>
      </div>

      <nav aria-label="Hauptnavigation" className={cn('flex-1 px-3 pb-4 pt-2', collapsed ? 'overflow-visible' : 'overflow-y-auto scrollbar-thin')}>
        {NAV_GROUPS.map((group, gi) => {
          const items = MAIN_NAV.filter((n) => n.group === group && (!n.permission || can(n.permission)))
          if (!items.length) return null
          return (
            <div key={group} className={cn(gi > 0 && 'mt-6')}>
              {collapsed ? (
                gi > 0 && <div className="mx-3 mb-3 h-px bg-black/[0.06]" />
              ) : (
                <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.02em] text-slate-500">{group}</p>
              )}
              <ul className="space-y-0.5">{items.map(renderItem)}</ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-black/[0.06] px-3 py-3">
        <ul className="space-y-0.5">{BOTTOM_NAV.map(renderItem)}</ul>
        {!mobile && onToggle && (
          <Tooltip content={collapsed ? 'Seitenleiste erweitern' : 'Seitenleiste einklappen'} side="right" className="mt-1 flex w-full">
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? 'Seitenleiste erweitern' : 'Seitenleiste einklappen'}
              className={cn(
                'flex h-9 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-slate-500 transition-colors hover:bg-black/[0.045] hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              {collapsed ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
              {!collapsed && 'Einklappen'}
            </button>
          </Tooltip>
        )}
      </div>

      {!collapsed && (
        <div className="mx-5 mb-1 flex items-center gap-2 pt-1 text-[11.5px] font-medium text-slate-500">
          <RisingMark className="h-2.5 w-7 text-brand" />
          Wissen, das bewegt.
        </div>
      )}
      <div className={cn('m-3 flex items-center gap-3 rounded-2xl bg-white/70 py-2.5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_2px_8px_-4px_rgba(0,0,0,0.1)]', collapsed ? 'justify-center px-1.5' : 'px-3')}>
        <Tooltip content={`${currentUser.name} · ${currentUser.role}`} side="right" disabled={!collapsed}>
          <Avatar initials={currentUser.initials} className="bg-gradient-to-br from-brand to-brand-700 text-white" />
        </Tooltip>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{currentUser.name}</p>
            <p className="truncate text-[11.5px] text-slate-500">{ROLE_LABELS[currentUser.appRole]}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
