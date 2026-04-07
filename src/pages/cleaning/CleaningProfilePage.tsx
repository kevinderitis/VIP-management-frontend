import { useMemo } from 'react'
import { Clock3, History, UserRound } from 'lucide-react'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { formatDateTime, formatTimeRange } from '../../utils/format'

export const CleaningProfilePage = () => {
  const user = useSessionUser()
  const tasks = useAppStore((state) => state.tasks)

  const completedHistory = useMemo(
    () =>
      tasks
        .filter((task) => task.audience === 'cleaning' && task.assignedTo === user?.id && task.status === 'completed')
        .sort(
          (left, right) =>
            new Date(right.endsAt ?? right.publishedAt).getTime() -
            new Date(left.endsAt ?? left.publishedAt).getTime(),
        ),
    [tasks, user?.id],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Cleaner profile"
        title="Shift summary"
        description="A simplified profile with credentials context, completed work, and time history."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <UserRound className="text-teal" />
            <div>
              <p className="text-sm text-slate-500">Cleaner</p>
              <p className="font-display text-2xl font-semibold text-ink">{user?.name}</p>
              <p className="mt-1 text-sm text-slate-500">{user?.title} · {user?.shift}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <History className="text-ink" />
            <div>
              <p className="text-sm text-slate-500">Completed tasks</p>
              <p className="font-display text-3xl font-semibold text-ink">{user?.completedTasks ?? 0}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="text-sky-700" />
            <div>
              <p className="text-sm text-slate-500">Login access</p>
              <p className="font-display text-2xl font-semibold text-ink">{user?.username}</p>
            </div>
          </div>
        </Panel>
      </div>
      <Panel className="p-6">
        <h3 className="section-title">Cleaning history</h3>
        <div className="mt-5 grid gap-3">
          {completedHistory.length ? (
            completedHistory.map((task) => (
              <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.cleaningLocationLabel}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Completed
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{formatDateTime(task.endsAt ?? task.publishedAt)}</p>
                <p className="mt-1 text-sm text-slate-500">{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
              No cleaning history is available yet.
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
