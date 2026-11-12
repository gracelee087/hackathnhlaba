import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const nowISO = () => new Date().toISOString()

export const todayDate = () => new Date().toISOString().slice(0, 10)

export function formatDate(value: string | null | undefined, fallback = 'unbefristet'): string {
  if (!value) return fallback
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateLong(value: string | Date): string {
  return new Date(value).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelative(value: string): string {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.round(hours / 24)
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  return formatDate(value)
}

export const formatNumber = (n: number) => n.toLocaleString('de-DE')

export function formatFileSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(kb))} KB`
}

export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items]
  let s = hashString(seed) || 1
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function daysAgo(days: number, hour = 9): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString()
}

export function getInitials(name: string): string {
  return name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/)
  return (match ? match[0] : text).trim()
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
