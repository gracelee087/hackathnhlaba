import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Header } from '@/components/layout/Header'
import { Floating3D } from '@/components/ui/floating-3d'
import { useApp } from '@/context/AppContext'

export function AppLayout() {
  const { state, setSidebarCollapsed } = useApp()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <Floating3D tone="light" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-pop"
      >
        Zum Inhalt springen
      </a>

      <div className="relative z-50 hidden lg:flex">
        <Sidebar collapsed={state.sidebarCollapsed} onToggle={() => setSidebarCollapsed(!state.sidebarCollapsed)} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <motion.div
              className="absolute inset-0 bg-navy-950/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 flex"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <Sidebar collapsed={false} mobile />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Navigation schließen"
                className="ml-2 mt-3 grid size-9 place-items-center rounded-full bg-white/80 text-foreground shadow-pop backdrop-blur hover:bg-white"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main ref={mainRef} id="main-content" className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </div>
          <footer className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 pb-8 text-[11.5px] text-slate-400 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
            <span>HELABA Knowledge Intelligence · Hackathon-Prototyp</span>
            <span>Demo-Umgebung: simulierte KI, fiktive Daten – keine Kundendaten</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
