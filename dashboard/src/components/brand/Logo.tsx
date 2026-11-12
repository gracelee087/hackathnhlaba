import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Logo-Platz der Anwendung.
 *
 * Legt eure Gruppe das offizielle Logo als Datei ab, wird es automatisch verwendet:
 *   public/logo.svg        – Logo für helle Flächen (Startseite, Kopfzeile)
 *   public/logo-white.svg  – Logo für dunkle Flächen (Seitenleiste, Fußzeile)
 * Fehlt die Datei, erscheint das eigene Projektzeichen (aufsteigende Linie).
 */
export function ProjectMark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[10px]',
        onDark ? 'bg-white' : 'bg-navy-800',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-[78%]">
        <path d="M5 23h7l8-12h7" fill="none" stroke="#e30613" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="11" r="2.6" fill={onDark ? '#153848' : '#ffffff'} />
      </svg>
    </span>
  )
}

export function Logo({
  onDark = false,
  compact = false,
  className,
}: {
  onDark?: boolean
  compact?: boolean
  className?: string
}) {
  const [official, setOfficial] = useState(true)
  const src = onDark ? '/logo-white.svg' : '/logo.svg'

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-3', className)}>
      {official ? (
        <img src={src} alt="Logo" onError={() => setOfficial(false)} className="h-8 w-auto shrink-0" />
      ) : (
        <ProjectMark onDark={onDark} />
      )}
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className={cn('block text-[15px] font-bold tracking-[0.2em]', onDark ? 'text-white' : 'text-navy-900')}>HELABA</span>
          <span className={cn('block truncate text-[9.5px] font-semibold tracking-[0.2em]', onDark ? 'text-white/65' : 'text-navy-700/70')}>
            KNOWLEDGE INTELLIGENCE
          </span>
        </span>
      )}
    </span>
  )
}
