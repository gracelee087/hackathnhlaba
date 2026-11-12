import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Clock, Sparkles, Trophy } from 'lucide-react'
import type { LearningModule, LearningProgress } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getModuleProgress } from '@/lib/learning'
import { cn } from '@/lib/utils'
import { thumbTone } from '@/lib/tones'

export const LEVEL_VARIANT = {
  Anfänger: 'success',
  Fortgeschrittene: 'brand',
  Experten: 'default',
} as const

export function CourseCard({ module, progress, index = 0 }: { module: LearningModule; progress: LearningProgress; index?: number }) {
  const p = getModuleProgress(module, progress)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}>
      <Link
        to={`/learning/${module.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <div className={cn('relative h-24 overflow-hidden', thumbTone(index))}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.2),transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <BookOpen className="absolute bottom-3 right-4 size-12 text-white/10" />
          <div className="absolute left-4 top-3 flex gap-1.5">
            <Badge variant={LEVEL_VARIANT[module.level]} className={cn(module.level === 'Experten' && 'bg-white text-navy-800')}>{module.level}</Badge>
            {module.generated && (
              <Badge className="border-white/20 bg-white/10 text-white"><Sparkles /> KI-generiert</Badge>
            )}
            {module.tags?.includes('neu') && <Badge className="border-transparent bg-brand text-white">Neu</Badge>}
          </div>
          <p className="absolute bottom-3 left-4 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-300">{module.category}</p>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-[14.5px] font-semibold leading-snug group-hover:text-brand-700">{module.title}</h3>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{module.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3.5" /> {module.durationMin} Min.</span>
            <span>{module.chapters.length} Kapitel</span>
            <span>Schwierigkeit: {module.difficulty}</span>
          </div>
          {module.targetRoles.length > 0 && (
            <p className="mt-2 line-clamp-1 text-[11.5px] text-slate-500">Für: {module.targetRoles.join(', ')}</p>
          )}
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
              <span className="font-medium text-foreground">
                {p.status === 'abgeschlossen' ? (
                  <span className="flex items-center gap-1 text-success"><Trophy className="size-3.5" /> Abgeschlossen</span>
                ) : (
                  `${p.completed}/${p.total} Kapitel`
                )}
              </span>
              <span className="tabular text-muted-foreground">{p.percent} %</span>
            </div>
            <Progress value={p.percent} indicatorClassName={p.status === 'abgeschlossen' ? 'bg-success' : undefined} label={`Fortschritt ${module.title}`} />
            <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand">
              {p.status === 'offen' ? 'Kurs starten' : p.status === 'abgeschlossen' ? 'Wiederholen' : 'Fortsetzen'} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
