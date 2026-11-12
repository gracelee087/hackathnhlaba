import { ArrowLeftRight, DoorOpen, Flag, Gem, Sunset, type LucideIcon } from 'lucide-react'
import type { Employee, InterviewTrigger } from '@/types'

export interface TriggerMeta {
  label: string
  agent: string
  goal: string
  icon: LucideIcon
  tone: string // Farbverlauf des Agenten-Symbols
  chip: string // Farben des Anlass-Chips
}

/** Anlass → zuständiger KI-Agent */
export const TRIGGER_META: Record<InterviewTrigger, TriggerMeta> = {
  ruhestand: {
    label: 'Ruhestand',
    agent: 'Erfahrungswissen-Agent',
    goal: 'sichert jahrzehntelange Praxiserfahrung',
    icon: Sunset,
    tone: 'from-warning to-brand',
    chip: 'bg-warning/10 text-[#8a4b05] ring-warning/30',
  },
  austritt: {
    label: 'Austritt',
    agent: 'Offboarding-Wissensagent',
    goal: 'übergibt laufende Aufgaben vor dem Abschied',
    icon: DoorOpen,
    tone: 'from-brand to-brand-700',
    chip: 'bg-brand-50 text-brand-700 ring-brand-100',
  },
  wechsel: {
    label: 'Interner Wechsel',
    agent: 'Rollenübergabe-Agent',
    goal: 'übergibt Wissen an die Nachfolge in der alten Rolle',
    icon: ArrowLeftRight,
    tone: 'from-sky-600 to-navy-700',
    chip: 'bg-sky-100 text-sky-600 ring-sky-100',
  },
  projektende: {
    label: 'Projektabschluss',
    agent: 'Lessons-Learned-Agent',
    goal: 'hält Erkenntnisse aus dem Projekt fest',
    icon: Flag,
    tone: 'from-sage-500 to-sage-700',
    chip: 'bg-sage-100 text-sage-700 ring-sage-200',
  },
  schluesselwissen: {
    label: 'Kritisches Wissen erkannt',
    agent: 'Expertenwissen-Agent',
    goal: 'dokumentiert Wissen, das nur eine Person hat',
    icon: Gem,
    tone: 'from-navy-600 to-navy-900',
    chip: 'bg-navy-50 text-navy-800 ring-navy-100',
  },
}

export const TRIGGER_ORDER: InterviewTrigger[] = ['ruhestand', 'austritt', 'wechsel', 'projektende', 'schluesselwissen']

/** Anlass einer Person – fällt bei älteren Daten auf den Austrittsgrund zurück. */
export function triggerOf(e: Pick<Employee, 'trigger' | 'exitReason'>): InterviewTrigger {
  if (e.trigger) return e.trigger
  switch (e.exitReason) {
    case 'Ruhestand':
      return 'ruhestand'
    case 'Interner Wechsel':
      return 'wechsel'
    case undefined:
      return 'schluesselwissen'
    default:
      return 'austritt'
  }
}
