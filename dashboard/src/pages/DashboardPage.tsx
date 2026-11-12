import { useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { ArrowRight, ChartColumn, Presentation, SquareKanban, Upload } from 'lucide-react'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { KnowledgeGrowthChart } from '@/components/dashboard/KnowledgeGrowthChart'
import { KnowledgeAtRisk, QuickActions, RecentActivity, ReviewAlert } from '@/components/dashboard/DashboardWidgets'
import { OnboardingDashboard } from '@/components/dashboard/OnboardingDashboard'
import { useApp } from '@/context/AppContext'
import { useMetrics } from '@/hooks/useMetrics'
import { formatDateLong } from '@/lib/utils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { state, user, can } = useApp()
  const m = useMetrics()

  if (user.appRole === 'neu') return <OnboardingDashboard />

  return (
    <div className="space-y-10">
      <HeroBanner
        eyebrow={formatDateLong(new Date())}
        title={`Guten Morgen, ${user.name.split(' ')[0]}.`}
        subtitle={
          <>
            <span className="font-semibold text-white">Wissen, das bewegt.</span> Erfahrungswissen sichern, bevor es das Haus verlässt – und
            neuen Kolleginnen und Kollegen genau das zeigen, was sie für ihre Rolle brauchen.
          </>
        }
        actions={
          <>
            {can('board.view') && (
              <Button size="lg" className="bg-white text-navy-900 shadow-[0_8px_30px_-10px_rgba(255,255,255,0.5)] hover:bg-white/90" onClick={() => navigate('/workforce')}>
                <SquareKanban /> Workforce Board
              </Button>
            )}
            {can('documents.manage') && (
              <Button size="lg" variant="outline" className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]" onClick={() => navigate('/documents')}>
                <Upload /> Dokument hochladen
              </Button>
            )}
            <Button size="lg" variant="outline" className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]" onClick={() => navigate('/praesentation')}>
              <Presentation /> Präsentation
            </Button>
            {can('analytics.view') && (
              <Button size="lg" variant="ghost" className="text-white/75 hover:bg-white/10 hover:text-white" onClick={() => navigate('/analytics')}>
                <ChartColumn /> Analytics
              </Button>
            )}
          </>
        }
        stats={[
          { label: 'Wissen gesichert', value: `${m.expertCoverage} %`, hint: 'kritisches Expertenwissen' },
          { label: 'Wissensträger im Fokus', value: m.atRisk.length, hint: 'Interview geplant / läuft' },
          { label: 'In Einarbeitung', value: m.workforce.newHires, hint: 'mit rollenbasierten Videos' },
        ]}
      />

      {can('review.decide') && <ReviewAlert />}

      <div className="grid auto-rows-[minmax(0,auto)] gap-6 lg:grid-cols-12">
        {/* Großkachel: Wissensfluss */}
        <button
          type="button"
          onClick={() => navigate(can('board.view') ? '/workforce' : '/learning')}
          className="lift group relative overflow-hidden rounded-[30px] bg-navy-950 p-8 text-left text-white lg:col-span-8 lg:row-span-2 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,#173a5e_0%,#0a1a2f_55%,#050d1a_100%)]" />
          <div className="k-glow pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/25 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/50">Wissensfluss</p>
            <h2 className="mt-3 max-w-xl text-[34px] font-semibold leading-[1.05] tracking-[-0.04em] lg:text-[44px]">
              Vom Anlass zum Erklärvideo.
            </h2>
            <div className="mt-auto grid grid-cols-2 gap-6 pt-12 sm:grid-cols-4">
              {[
                { v: m.workforce.austritt_geplant, l: 'Interview geplant', c: 'bg-warning' },
                { v: m.workforce.interview, l: 'Im KI-Interview', c: 'bg-brand-300' },
                { v: m.workforce.wissen_gesichert, l: 'Wissen gesichert', c: 'bg-sage-500' },
                { v: m.activeModules, l: 'Lernmodule aktiv', c: 'bg-sky-600' },
              ].map((x, i) => (
                <div key={x.l} className="k-in" style={{ animationDelay: `${150 + i * 120}ms` }}>
                  <p className="text-[56px] font-semibold leading-none tracking-[-0.05em] tabular lg:text-[64px]">{x.v}</p>
                  <p className="mt-3 flex items-center gap-2 text-[14px] text-white/60">
                    <span className={`size-2 rounded-full ${x.c}`} /> {x.l}
                  </p>
                </div>
              ))}
            </div>
            <span className="mt-10 inline-flex items-center gap-2 text-[14px] font-semibold text-white/80 transition-colors group-hover:text-white">
              {can('board.view') ? 'Workforce Board öffnen' : 'Zur Learning Academy'}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </button>

        {/* Kachel: Abdeckung */}
        <div className="lift relative overflow-hidden rounded-[30px] bg-white p-8 shadow-card lg:col-span-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-500">Wissen gesichert</p>
          <p className="mt-4 text-[72px] font-semibold leading-none tracking-[-0.05em] text-navy-900 tabular">
            {m.expertCoverage}
            <span className="text-brand">%</span>
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/[0.06]">
            <div className="k-fill h-full rounded-full bg-gradient-to-r from-brand to-brand-300" style={{ '--w': `${m.expertCoverage}%` } as CSSProperties} />
          </div>
          <p className="mt-4 text-[14px] text-slate-500">des kritischen Expertenwissens dokumentiert</p>
        </div>

        {/* Kachel: Präsentation */}
        <button
          type="button"
          onClick={() => navigate('/praesentation')}
          className="lift group relative overflow-hidden rounded-[30px] bg-gradient-to-br from-brand to-brand-700 p-8 text-left text-white lg:col-span-4"
        >
          <div className="k-float pointer-events-none absolute -bottom-10 -right-8 size-40 rounded-full bg-white/15 blur-2xl" />
          <Presentation className="size-8" />
          <p className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.03em]">Präsentation starten</p>
          <p className="mt-2 text-[14px] text-white/75">Die Story als Keynote – mit Sprung in die Live-Demo.</p>
          <ArrowRight className="mt-6 size-5 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="lg:col-span-7">
          <KnowledgeGrowthChart data={m.growth} />
        </div>
        <div className="lg:col-span-5">
          <KnowledgeAtRisk experts={m.atRisk} />
        </div>

        <div className="lg:col-span-7">
          <RecentActivity activities={state.activities} />
        </div>
        <div className="lg:col-span-5">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
