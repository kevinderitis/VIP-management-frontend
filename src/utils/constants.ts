import { Activity, BellRing, Coffee, Gift, Hotel, ShieldCheck, Sparkles } from 'lucide-react'
import { TaskStatus, UserRole } from '../types/models'

export const roleHomePath: Record<UserRole, string> = {
  admin: '/admin',
  volunteer: '/app',
  cleaner: '/cleaning',
}

export const statusStyles: Record<TaskStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-amber-100 text-amber-800',
  available: 'bg-teal-100 text-teal-800',
  assigned: 'bg-sky-100 text-sky-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
}

export const priorityStyles = {
  low: 'text-slate-500',
  medium: 'text-amber-700',
  high: 'text-orange-700',
  urgent: 'text-rose-700',
}

export const rewardIcons = {
  coffee: Coffee,
  gift: Gift,
  sparkles: Sparkles,
  hospitality: Hotel,
  shield: ShieldCheck,
  bell: BellRing,
  activity: Activity,
}
