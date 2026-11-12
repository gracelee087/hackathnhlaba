import type * as React from 'react'
import { FileSearch, GraduationCap, Library, MessagesSquare, Trophy } from 'lucide-react'
import type { ActivityType } from '@/types'

export const ACTIVITY_META: Record<ActivityType, { icon: React.ElementType; className: string }> = {
  document: { icon: FileSearch, className: 'bg-brand-50 text-brand' },
  interview: { icon: MessagesSquare, className: 'bg-navy-50 text-navy-800' },
  module: { icon: GraduationCap, className: 'bg-success/10 text-success' },
  article: { icon: Library, className: 'bg-slate-100 text-slate-600' },
  quiz: { icon: Trophy, className: 'bg-warning/10 text-warning' },
}
