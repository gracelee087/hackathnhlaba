import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, CircleCheck, CircleHelp, LogOut, Menu, RotateCcw, Settings, UserRound } from 'lucide-react'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { ACTIVITY_META } from '@/components/layout/activity-meta'
import { ALL_NAV } from '@/components/navigation/nav-items'
import { DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator } from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/context/AppContext'
import { USERS } from '@/data/mock-data'
import { ROLE_LABELS } from '@/lib/permissions'
import { cn, formatRelative } from '@/lib/utils'

function useBreadcrumbs() {
  const { pathname } = useLocation()
  const { state } = useApp()
  const crumbs: { label: string; to?: string }[] = [{ label: 'Helaba KI', to: '/dashboard' }]
  if (pathname === '/dashboard') return [...crumbs, { label: 'Dashboard' }]
  const [first, second] = pathname.split('/').filter(Boolean)
  const section = ALL_NAV.find((n) => n.path === `/${first}`)
  if (!section) return [...crumbs, { label: 'Seite nicht gefunden' }]
  if (!second) return [...crumbs, { label: section.label }]
  crumbs.push({ label: section.label, to: section.path })
  if (first === 'knowledge-base') crumbs.push({ label: state.articles.find((a) => a.id === second)?.title ?? 'Artikel' })
  else if (first === 'learning') crumbs.push({ label: state.modules.find((m) => m.id === second)?.title ?? 'Kurs' })
  return crumbs
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const crumbs = useBreadcrumbs()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, user: currentUser, setCurrentUser, markNotificationsRead, resetDemo } = useApp()
  const [resetOpen, setResetOpen] = useState(false)
  const unread = state.activities.filter((a) => a.timestamp > state.notificationsReadAt)

  return (
    <header className="glass sticky top-0 z-40 flex h-[68px] shrink-0 items-center gap-3 border-b border-black/[0.06] px-4 sm:px-6 lg:px-10">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenuClick} aria-label="Navigation öffnen">
        <Menu />
      </Button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] md:flex">
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-slate-300" />}
            {c.to && i < crumbs.length - 1 ? (
              <Link to={c.to} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className="max-w-[260px] truncate font-medium text-foreground" aria-current="page">
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:flex-none">
        <GlobalSearch className="w-full max-w-[340px] md:w-[300px] xl:w-[380px]" />

        <DropdownMenu
          className="w-[360px] p-0"
          trigger={({ toggle, open }) => (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Benachrichtigungen${unread.length ? ` (${unread.length} neu)` : ''}`}
              aria-expanded={open}
              onClick={toggle}
              className="relative"
            >
              <Bell className="!size-[18px] text-slate-600" />
              {unread.length > 0 && (
                <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9.5px] font-bold leading-4 text-white ring-2 ring-white">
                  {unread.length > 9 ? '9+' : unread.length}
                </span>
              )}
            </Button>
          )}
        >
          {({ close }) => (
            <div>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-[13px] font-semibold">Benachrichtigungen</p>
                <button
                  type="button"
                  onClick={markNotificationsRead}
                  disabled={!unread.length}
                  className="text-[12px] font-medium text-brand hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  Alle als gelesen markieren
                </button>
              </div>
              <ul className="max-h-[360px] overflow-y-auto p-1 scrollbar-thin">
                {state.activities.slice(0, 8).map((a) => {
                  const meta = ACTIVITY_META[a.type]
                  const Icon = meta.icon
                  const isUnread = a.timestamp > state.notificationsReadAt
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (a.link) navigate(a.link)
                          close()
                        }}
                        className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-md', meta.className)}>
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-foreground">{a.title}</span>
                          <span className="block truncate text-[12px] text-muted-foreground">{a.description}</span>
                          <span className="mt-0.5 block text-[11px] text-slate-400">{formatRelative(a.timestamp)}</span>
                        </span>
                        {isUnread && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </DropdownMenu>

        <DropdownMenu
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label="Profilmenü öffnen"
              className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100 sm:pr-2"
            >
              <Avatar initials={currentUser.initials} className="bg-brand text-white" />
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-[13px] font-semibold text-foreground">{currentUser.name}</span>
                <span className="block text-[11px] text-muted-foreground">{ROLE_LABELS[currentUser.appRole]}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div className="px-2.5 py-2">
                <p className="text-[13px] font-semibold">{currentUser.name}</p>
                <p className="text-[12px] text-muted-foreground">{currentUser.email}</p>
              </div>
              <DropdownSeparator />
              <DropdownLabel>Ansicht wechseln (Demo)</DropdownLabel>
              {USERS.map((u) => (
                <DropdownItem
                  key={u.id}
                  icon={u.id === currentUser.id ? CircleCheck : UserRound}
                  hint={ROLE_LABELS[u.appRole]}
                  onSelect={() => {
                    setCurrentUser(u.id)
                    close()
                    navigate('/dashboard')
                    toast({ title: `Angemeldet als ${u.name}`, description: ROLE_LABELS[u.appRole] })
                  }}
                >
                  {u.name}
                </DropdownItem>
              ))}
              <DropdownSeparator />
              <DropdownLabel>Konto</DropdownLabel>
              <DropdownItem icon={UserRound} onSelect={() => { navigate('/settings'); close() }}>Mein Profil</DropdownItem>
              <DropdownItem icon={Settings} onSelect={() => { navigate('/settings'); close() }}>Einstellungen</DropdownItem>
              <DropdownItem icon={CircleHelp} onSelect={() => { navigate('/help'); close() }}>Hilfe & Support</DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={RotateCcw} onSelect={() => { setResetOpen(true); close() }}>Demo-Daten zurücksetzen</DropdownItem>
              <DropdownItem
                icon={LogOut}
                danger
                onSelect={() => {
                  close()
                  toast({ title: 'Abmelden in der Demo deaktiviert', description: 'In der Produktivumgebung erfolgt hier die SSO-Abmeldung.' })
                }}
              >
                Abmelden
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </div>

      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Demo-Daten zurücksetzen?"
        description="Alle hochgeladenen Dokumente, Interviews, generierten Module und Lernfortschritte dieser Demo werden auf den Ausgangszustand zurückgesetzt."
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Abbrechen</Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetDemo()
                setResetOpen(false)
                navigate('/dashboard')
                toast({ title: 'Demo zurückgesetzt', variant: 'success' })
              }}
            >
              Zurücksetzen
            </Button>
          </>
        }
      />
    </header>
  )
}
