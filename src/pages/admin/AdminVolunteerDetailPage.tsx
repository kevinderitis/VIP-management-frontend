import { useMemo } from 'react'
import { ArrowLeft, Clock3, KeyRound, Medal, ShieldCheck, UserRound } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Panel } from '../../components/common/Panel'
import { ProgressBar } from '../../components/common/ProgressBar'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { formatDate, formatDateTime, formatTimeRange, formatWeekday } from '../../utils/format'

export const AdminVolunteerDetailPage = () => {
  const { volunteerId } = useParams()
  const users = useAppStore((state) => state.users)
  const tasks = useAppStore((state) => state.tasks)
  const taskHistory = useAppStore((state) => state.taskHistory)
  const volunteer = users.find((user) => user.id === volunteerId && user.role === 'volunteer')

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.audience === 'volunteer' &&
          task.assignedTo === volunteerId &&
          ['assigned', 'scheduled'].includes(task.status),
      ),
    [tasks, volunteerId],
  )

  const completedHistory = useMemo(
    () => taskHistory.filter((entry) => entry.volunteerId === volunteerId),
    [taskHistory, volunteerId],
  )

  if (!volunteer) {
    return <Navigate to="/admin/volunteers" replace />
  }

  return (
    <div className="grid gap-6">
      <Link
        to="/admin/volunteers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to volunteers
      </Link>

      <SectionHeader
        eyebrow="Volunteer profile"
        title={volunteer.name}
        description="Full volunteer view with credentials, pending work, and task history for admin follow-up."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <UserRound className="text-teal" />
            <div>
              <p className="text-sm text-slate-500">Role, shift, and off day</p>
              <p className="font-display text-2xl font-semibold text-ink">{volunteer.title}</p>
              <p className="mt-1 text-sm text-slate-500">{volunteer.shift} · Off day {formatWeekday(volunteer.offDay ?? 'sunday')}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Medal className="text-amber-600" />
            <div>
              <p className="text-sm text-slate-500">Points and progress</p>
              <p className="font-display text-3xl font-semibold text-ink">{volunteer.points}</p>
            </div>
          </div>
          <ProgressBar value={volunteer.points} max={320} className="mt-4" />
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className={volunteer.isActive ? 'text-emerald-600' : 'text-slate-400'} />
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="font-display text-2xl font-semibold text-ink">{volunteer.isActive ? 'Active' : 'Inactive'}</p>
              <p className="mt-1 text-sm text-slate-500">{volunteer.completedTasks} completed tasks</p>
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
                <p className="mt-2 font-semibold text-ink">{volunteer.username}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Password</p>
                <p className="mt-2 font-semibold text-ink">{volunteer.password}</p>
              </div>
              {volunteer.email ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Contact email
                  </p>
                  <p className="mt-2 font-semibold text-ink">{volunteer.email}</p>
                </div>
              ) : null}
              <div className="rounded-[22px] bg-mist p-4 text-sm text-slate-600">
                Admin can review these access details and share them again if the volunteer loses access.
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="section-title">Pending tasks</h3>
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
                    <p className="mt-2 text-sm text-slate-500">{task.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                      <span>{task.points} pts</span>
                      <span>{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} />
                        {formatDateTime(task.scheduledAt ?? task.publishedAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  This volunteer has no pending tasks right now.
                </div>
              )}
            </div>
          </Panel>
        </div>

        <Panel className="p-6">
          <h3 className="section-title">Completed task history</h3>
          <div className="mt-5 grid gap-3">
            {completedHistory.length ? (
              completedHistory.map((entry) => {
                const task = tasks.find((item) => item.id === entry.taskId)
                return (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{task?.title ?? 'Completed task slot'}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(entry.completedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          +{entry.points} pts
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{entry.source}</p>
                      </div>
                    </div>
                    {task?.description ? (
                      <p className="mt-3 text-sm text-slate-500">{task.description}</p>
                    ) : null}
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                No completed task history is available yet.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
