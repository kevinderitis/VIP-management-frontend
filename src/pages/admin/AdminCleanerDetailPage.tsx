import { useMemo } from 'react'
import { ArrowLeft, Clock3, KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useCleanerUsers } from '../../store/app-store'
import { formatDateTime, formatTimeRange } from '../../utils/format'

export const AdminCleanerDetailPage = () => {
  const { cleanerId } = useParams()
  const cleaners = useCleanerUsers()
  const tasks = useAppStore((state) => state.tasks)
  const cleaner = cleaners.find((user) => user.id === cleanerId)

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.audience === 'cleaning' &&
          task.assignedTo === cleanerId &&
          ['assigned', 'scheduled'].includes(task.status),
      ),
    [cleanerId, tasks],
  )

  const completedTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            task.audience === 'cleaning' &&
            task.assignedTo === cleanerId &&
            task.status === 'completed',
        )
        .sort(
          (left, right) =>
            new Date(right.endsAt ?? right.publishedAt).getTime() -
            new Date(left.endsAt ?? left.publishedAt).getTime(),
        ),
    [cleanerId, tasks],
  )

  if (!cleaner) {
    return <Navigate to="/admin/cleaners" replace />
  }

  return (
    <div className="grid gap-6">
      <Link
        to="/admin/cleaners"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to cleaning staff
      </Link>

      <SectionHeader
        eyebrow="Cleaner profile"
        title={cleaner.name}
        description="Access credentials, assigned work, and cleaning history in a simplified operational view."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <UserRound className="text-teal" />
            <div>
              <p className="text-sm text-slate-500">Role and shift</p>
              <p className="font-display text-2xl font-semibold text-ink">{cleaner.title}</p>
              <p className="mt-1 text-sm text-slate-500">{cleaner.shift}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="text-sky-700" />
            <div>
              <p className="text-sm text-slate-500">Completed cleanings</p>
              <p className="font-display text-3xl font-semibold text-ink">{cleaner.completedTasks}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className={cleaner.isActive ? 'text-emerald-600' : 'text-slate-400'} />
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="font-display text-2xl font-semibold text-ink">{cleaner.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-6">
          <Panel className="p-6">
            <h3 className="section-title">Access credentials</h3>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <KeyRound size={13} />
                  Username
                </p>
                <p className="mt-2 font-semibold text-ink">{cleaner.username}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Password</p>
                <p className="mt-2 font-semibold text-ink">{cleaner.password}</p>
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="section-title">Assigned tasks</h3>
            <div className="mt-5 grid gap-3">
              {pendingTasks.length ? (
                pendingTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{task.title}</p>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 capitalize">
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{task.cleaningLocationLabel}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                      <span>{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</span>
                      <span>{formatDateTime(task.scheduledAt ?? task.publishedAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  This cleaner has no pending tasks right now.
                </div>
              )}
            </div>
          </Panel>
        </div>

        <Panel className="p-6">
          <h3 className="section-title">Cleaning history</h3>
          <div className="mt-5 grid gap-3">
            {completedTasks.length ? (
              completedTasks.map((task) => (
                <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-ink">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{task.cleaningLocationLabel}</p>
                  <p className="mt-2 text-sm text-slate-500">{formatDateTime(task.endsAt ?? task.publishedAt)}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                No completed cleaning history is available yet.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
