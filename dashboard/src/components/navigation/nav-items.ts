import type { Permission } from '@/lib/permissions'
import {
  Bot,
  ClipboardCheck,
  ChartColumn,
  FileSearch,
  GraduationCap,
  LayoutDashboard,
  Library,
  LifeBuoy,
  MessagesSquare,
  Mic,
  Presentation,
  Settings,
  Sparkles,
  SquareKanban,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  badgeKey?: 'interviews' | 'review' | 'leaving' | 'reviews'
  permission?: Permission
  group?: NavGroup
}

export type NavGroup = 'Übersicht' | 'Wissen sichern' | 'Wissen vermitteln' | 'Steuerung'
export const NAV_GROUPS: NavGroup[] = ['Übersicht', 'Wissen sichern', 'Wissen vermitteln', 'Steuerung']

export const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, group: 'Übersicht' },
  { label: 'Workforce Board', path: '/workforce', icon: SquareKanban, badgeKey: 'leaving', permission: 'board.view', group: 'Übersicht' },
  { label: 'Vier-Augen-Prüfung', path: '/reviews', icon: ClipboardCheck, badgeKey: 'reviews', permission: 'review.decide', group: 'Übersicht' },
  { label: 'Präsentation', path: '/praesentation', icon: Presentation, group: 'Übersicht' },
  { label: 'Document Intelligence', path: '/documents', icon: FileSearch, permission: 'documents.manage', group: 'Wissen sichern' },
  { label: 'Expert Knowledge', path: '/expert-knowledge', icon: MessagesSquare, badgeKey: 'interviews', permission: 'interview.conduct', group: 'Wissen sichern' },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: Library, badgeKey: 'review', permission: 'kb.view', group: 'Wissen sichern' },
  { label: 'AI Interview', path: '/ai-interview', icon: Mic, group: 'Wissen vermitteln' },
  { label: 'Learning Academy', path: '/learning', icon: GraduationCap, group: 'Wissen vermitteln' },
  { label: 'AI Content Studio', path: '/content-studio', icon: Sparkles, permission: 'content.create', group: 'Wissen vermitteln' },
  { label: 'AI Knowledge Assistant', path: '/assistant', icon: Bot, group: 'Wissen vermitteln' },
  { label: 'Analytics', path: '/analytics', icon: ChartColumn, permission: 'analytics.view', group: 'Steuerung' },
]

export const BOTTOM_NAV: NavItem[] = [
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Help & Support', path: '/help', icon: LifeBuoy },
]

export const ALL_NAV = [...MAIN_NAV, ...BOTTOM_NAV]
