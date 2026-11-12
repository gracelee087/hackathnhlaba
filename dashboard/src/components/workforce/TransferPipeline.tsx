import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock, CircleCheck, Clapperboard, LogOut, MessagesSquare, UserPlus, type LucideIcon } from 'lucide-react'
import type { Employee, EmployeeStatus } from '@/types'
import { EMPLOYEE_STATUS_META } from '@/lib/permissions'
import { cn } from '@/lib/utils'

const STAGES: { status: EmployeeStatus; icon: LucideIcon; sub: string; dot: string; glow: string }[] = [
  { status: 'austritt_geplant', icon: CalendarClock, sub: 'Anlass erkannt', dot: 'bg-warning', glow: 'rgba(245,158,11,0.55)' },
  { status: 'interview', icon: MessagesSquare, sub: 'KI fragt nach', dot: 'bg-brand', glow: 'rgba(227,6,19,0.7)' },
  { status: 'wissen_gesichert', icon: CircleCheck, sub: 'Videos verfügbar', dot: 'bg-sage-500', glow: 'rgba(34,160,110,0.6)' },
  { status: 'ausgeschieden', icon: LogOut, sub: 'nicht mehr im Haus', dot: 'bg-white/50', glow: 'rgba(255,255,255,0.25)' },
]

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

/** Wissensfluss: vom Austritt bis zum gesicherten Wissen – als leuchtende Strecke. */
export function TransferPipeline({ employees, compact = false }: { employees: Employee[]; compact?: boolean }) {
  const navigate = useNavigate()
  const count = (s: EmployeeStatus) => employees.filter((e) => e.status === s).length
  const leaving = employees.filter((e) => e.status !== 'aktiv')
  const secured = leaving.filter((e) => e.status === 'wissen_gesichert' || (e.status === 'ausgeschieden' && e.moduleIds.length > 0)).length
  const rate = leaving.length ? Math.round((secured / leaving.length) * 100) : 0
  const videos = new Set(employees.flatMap((e) => e.moduleIds)).size
  const newHires = employees.filter((e) => e.isNewHire && e.status === 'aktiv').length

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-navy-950 text-white shadow-[0_30px_80px_-40px_rgba(10,26,47,0.8)]">
      {/* Bühne */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_0%_0%,#173a5e_0%,#0a1a2f_50%,#050d1a_100%)]" />
      <div className="k-glow pointer-events-none absolute -right-20 -top-32 size-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="drift-a pointer-events-none absolute -bottom-40 left-1/4 size-96 rounded-full bg-sky-600/15 blur-3xl" />

      <div className="relative px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-white/45">Wissensfluss</p>
            <h3 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[34px]">Vom Anlass zum Erklärvideo.</h3>
          </div>
          {!compact && (
            <button
              type="button"
              onClick={() => navigate('/workforce')}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-medium ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
            >
              Workforce Board <ArrowRight className="size-4" />
            </button>
          )}
        </div>

        {/* Strecke */}
        <div className="relative mt-12">
          <div className="absolute inset-x-[12.5%] top-12 hidden h-px md:block" aria-hidden="true">
            <div className="absolute inset-0 bg-white/10" />
            <div className="flow-line absolute inset-0 bg-gradient-to-r from-warning via-brand to-sage-500 opacity-80" />
            <span className="flow-dot absolute -top-[5px] size-[11px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_6px_rgba(255,255,255,0.55)]" />
          </div>

          <ol className="relative grid gap-3 md:grid-cols-4 md:gap-4">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon
              const n = count(stage.status)
              const hot = stage.status === 'interview' && n > 0
              return (
                <li key={stage.status} className="k-in" style={delay(150 + i * 140)}>
                  <button
                    type="button"
                    onClick={() => navigate('/workforce')}
                    className="group flex w-full items-center gap-4 rounded-[22px] p-3 text-left transition-colors hover:bg-white/[0.05] md:flex-col md:items-center md:gap-0 md:p-4 md:text-center"
                  >
                    <span
                      className={cn(
                        'relative grid size-16 shrink-0 place-items-center rounded-full bg-[#14304f] ring-1 ring-white/15 backdrop-blur-xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105',
                        hot && 'k-pulse',
                      )}
                      style={{ boxShadow: `0 0 40px -8px ${stage.glow}` }}
                    >
                      <Icon className="size-6 text-white/90" />
                      <span className={cn('absolute right-1 top-1 size-2.5 rounded-full ring-2 ring-navy-950', stage.dot)} />
                    </span>
                    <span className="min-w-0 md:mt-5">
                      <span className="block text-[44px] font-semibold leading-none tracking-[-0.05em] tabular md:text-[52px]">{n}</span>
                      <span className="mt-2 block text-[14px] font-semibold text-white/90">{EMPLOYEE_STATUS_META[stage.status].label}</span>
                      <span className="block text-[12.5px] text-white/45">{stage.sub}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Kennzahlen */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="k-in rounded-[20px] bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur" style={delay(900)}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-white/60">Wissen gesichert (alle Anlässe)</span>
              <span className="text-[15px] font-semibold tabular">
                {secured}/{leaving.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={rate} aria-valuemin={0} aria-valuemax={100} aria-label="Sicherungsquote">
              <div className="k-fill h-full rounded-full bg-gradient-to-r from-sage-600 to-sage-500" style={{ '--w': `${rate}%`, animationDelay: '1100ms' } as CSSProperties} />
            </div>
          </div>
          <div className="k-in flex items-center gap-4 rounded-[20px] bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur" style={delay(1000)}>
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-700">
              <Clapperboard className="size-5" />
            </span>
            <span>
              <span className="block text-[24px] font-semibold leading-none tracking-[-0.03em] tabular">{videos}</span>
              <span className="text-[13px] text-white/60">Erklärvideos aus Expertenwissen</span>
            </span>
          </div>
          <div className="k-in flex items-center gap-4 rounded-[20px] bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur" style={delay(1100)}>
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-600 to-navy-700">
              <UserPlus className="size-5" />
            </span>
            <span>
              <span className="block text-[24px] font-semibold leading-none tracking-[-0.03em] tabular">{newHires}</span>
              <span className="text-[13px] text-white/60">neue Mitarbeitende lernen rollenbasiert</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
