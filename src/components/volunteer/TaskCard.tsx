import { BedDouble, CalendarDays, ChevronDown, Clock3, Coins, ScrollText, Sparkles, Trophy } from 'lucide-react'
import { Task } from '../../types/models'
import { formatDate, formatDateTime, formatTimeRange } from '../../utils/format'
import { PriorityBadge, StatusBadge } from '../common/Badge'
import { Button } from '../common/Button'
import { Panel } from '../common/Panel'

export const TaskCard = ({
  task,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  task: Task
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}) => (
  <Panel className="overflow-hidden rounded-[24px]">
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-teal to-lagoon p-2.5 text-white shadow-float">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <h3 className="mt-2 truncate font-display text-lg font-semibold text-ink">{task.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
              <Coins size={13} />
              {task.points}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={13} />
              {formatDate(task.scheduledAt ?? task.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} />
              {formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}
            </span>
            {task.bedTask && (task.cleaningRoomCode || task.cleaningRoomNumber) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">
                <BedDouble size={13} />
                {task.cleaningRoomCode ? `Room ${task.cleaningRoomCode}` : `Room ${task.cleaningRoomNumber}`}
                {task.cleaningBedNumber ? ` · Bed ${task.cleaningBedNumber}` : ''}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition group-open:rotate-180">
          <ChevronDown size={16} />
        </div>
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4 pt-3">
        <div className="grid gap-3 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <ScrollText size={13} />
              What to do
            </p>
            <p className="mt-2 leading-6 text-slate-600">{task.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Category</p>
              <p className="mt-1 font-semibold capitalize text-ink">{task.category}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <Trophy size={13} />
                Reward
              </p>
              <p className="mt-1 font-semibold text-ink">{task.points} trophy points</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Schedule</p>
              <p className="mt-1 font-semibold text-ink">{formatDateTime(task.scheduledAt ?? task.publishedAt)}</p>
              <p className="mt-1 text-sm text-slate-500">{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</p>
            </div>
          </div>
        </div>
        {actionLabel && onAction ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button onClick={onAction} className={secondaryActionLabel ? 'w-full' : 'sm:col-span-2'}>
              {actionLabel}
            </Button>
            {secondaryActionLabel && onSecondaryAction ? (
              <Button variant="secondary" onClick={onSecondaryAction} className="w-full">
                {secondaryActionLabel}
              </Button>
            ) : null}
          </div>
        ) : secondaryActionLabel && onSecondaryAction ? (
          <Button variant="secondary" onClick={onSecondaryAction} className="mt-4 w-full">
            {secondaryActionLabel}
          </Button>
        ) : null}
      </div>
    </details>
  </Panel>
)
