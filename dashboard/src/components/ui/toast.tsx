import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { cn, uid } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
}

const ToastContext = React.createContext<{ toast: (t: ToastOptions) => void } | null>(null)

const icons: Record<ToastVariant, React.ElementType> = {
  default: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: TriangleAlert,
}

const iconColor: Record<ToastVariant, string> = {
  default: 'text-brand',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = uid('toast')
      setToasts((t) => [...t.slice(-3), { ...options, id }])
      window.setTimeout(() => dismiss(id), options.duration ?? 4800)
    },
    [dismiss],
  )

  const value = React.useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const variant = t.variant ?? 'default'
            const Icon = icons[variant]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-white p-3.5 shadow-pop"
                role="status"
              >
                <Icon className={cn('mt-0.5 size-4 shrink-0', iconColor[variant])} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t.description}</p>}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick()
                        dismiss(t.id)
                      }}
                      className="mt-2 text-[12.5px] font-semibold text-brand hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Benachrichtigung schließen"
                  onClick={() => dismiss(t.id)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast muss innerhalb von <ToastProvider> verwendet werden')
  return ctx
}
