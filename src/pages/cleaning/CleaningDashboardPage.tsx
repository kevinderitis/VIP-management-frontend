import { useMemo } from 'react'
import { CalendarClock, ClipboardCheck, History } from 'lucide-react'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { StatCard } from '../../components/common/StatCard'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { formatDateTime, formatTimeRange, toLocalDateKey } from '../../utils/format'

export const CleaningDashboardPage = () => {
  const user = useSessionUser()
  const tasks = useAppStore((state) => state.tasks)
  const today = toLocalDateKey()

  const todayAssigned = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.audience === 'cleaning' &&
          task.assignedTo === user?.id &&
          ['assigned', 'scheduled'].includes(task.status) &&
          toLocalDateKey(task.scheduledAt ?? task.publishedAt) === today,
      ),
    [tasks, today, user?.id],
  )

  const available = useMemo(
    () => tasks.filter((task) => task.audience === 'cleaning' && task.status === 'available'),
    [tasks],
  )

  const completed = useMemo(
    () => tasks.filter((task) => task.audience === 'cleaning' && task.assignedTo === user?.id && task.status === 'completed'),
    [tasks, user?.id],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Cleaning overview"
        title="Your cleaning shift"
        description="A simplified view of what is assigned today, what is still available, and what you completed recently."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned today" value={todayAssigned.length} hint="Tasks in your queue" icon={<CalendarClock size={18} />} />
        <StatCard label="Available now" value={available.length} hint="Ready to be claimed" icon={<ClipboardCheck size={18} />} />
        <StatCard label="Completed" value={completed.length} hint="Recorded in your history" icon={<History size={18} />} />
      </div>
      <Panel className="p-6">
        <h3 className="section-title">Today’s assigned tasks</h3>
        <div className="mt-5 grid gap-3">
          {todayAssigned.length ? (
            todayAssigned.map((task) => (
              <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.cleaningLocationLabel}</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 capitalize">
                    {task.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{formatDateTime(task.scheduledAt ?? task.publishedAt)}</p>
                <p className="mt-1 text-sm text-slate-500">{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
              There are no assigned cleaning tasks for today yet.
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
