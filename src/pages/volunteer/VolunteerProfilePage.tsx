import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Coins, History, Search, Trophy } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Panel } from '../../components/common/Panel'
import { ProgressBar } from '../../components/common/ProgressBar'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { formatDate, formatDateTime, formatTimeRange } from '../../utils/format'

export const VolunteerProfilePage = () => {
  const user = useSessionUser()
  const allTasks = useAppStore((state) => state.tasks)
  const taskHistory = useAppStore((state) => state.taskHistory)
  const allRedemptions = useAppStore((state) => state.redemptions)
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [historyPage, setHistoryPage] = useState(1)
  const historyPageSize = 8

  const history = useMemo(
    () => taskHistory.filter((entry) => entry.volunteerId === user?.id),
    [taskHistory, user?.id],
  )
  const redemptions = useMemo(
    () => allRedemptions.filter((item) => item.volunteerId === user?.id),
    [allRedemptions, user?.id],
  )
  const upcomingTasks = useMemo(
    () =>
      allTasks
        .filter(
          (task) =>
            task.audience === 'volunteer' &&
            task.assignedTo === user?.id &&
            ['assigned', 'scheduled'].includes(task.status) &&
            task.scheduledAt,
        )
        .sort(
          (left, right) =>
            new Date(left.scheduledAt ?? left.publishedAt).getTime() -
            new Date(right.scheduledAt ?? right.publishedAt).getTime(),
        )
        .slice(0, 6),
    [allTasks, user?.id],
  )
  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase()

    return history.filter((entry) => {
      const task = allTasks.find((item) => item.id === entry.taskId)
      const matchesStatus = historyStatusFilter === 'all' || entry.status === historyStatusFilter
      const matchesQuery =
        !query ||
        entry.taskTitle.toLowerCase().includes(query) ||
        (entry.taskDescription ?? '').toLowerCase().includes(query) ||
        (task?.cleaningRoomCode ?? '').toLowerCase().includes(query)

      return matchesStatus && matchesQuery
    })
  }, [allTasks, history, historySearch, historyStatusFilter])

  useEffect(() => {
    setHistoryPage(1)
  }, [historySearch, historyStatusFilter])

  const historyPages = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize))
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize)

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Profile and progress"
        title="Your hostel journey"
        description="A simple history of completed tasks, lifetime earnings, current redeemable points, and redeemed rewards."
      />
      <div className="grid gap-4 lg:grid-cols-4">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Coins className="text-teal" />
            <div>
              <p className="text-sm text-slate-500">Lifetime earned</p>
              <p className="font-display text-3xl font-semibold text-ink">{user?.lifetimePoints ?? 0}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Historical total from all completed tasks since the beginning.</p>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Coins className="text-amber-600" />
            <div>
              <p className="text-sm text-slate-500">Available now</p>
              <p className="font-display text-3xl font-semibold text-ink">{user?.points ?? 0}</p>
            </div>
          </div>
          <ProgressBar value={user?.points ?? 0} max={320} className="mt-4" />
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-600" />
            <div>
              <p className="text-sm text-slate-500">Current badge</p>
              <p className="font-display text-2xl font-semibold text-ink">{user?.badge ?? 'No badge yet'}</p>
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
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-teal" size={18} />
              <h3 className="section-title">Upcoming schedule</h3>
            </div>
            <div className="mt-5 grid gap-3">
              {upcomingTasks.length ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(task.scheduledAt ?? task.publishedAt)}</p>
                      </div>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 capitalize">
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</p>
                    <p className="mt-2 text-sm text-slate-500">{task.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No scheduled tasks for today or the next few days.
                </div>
              )}
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="section-title">Task history</h3>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {filteredHistory.length} result{filteredHistory.length === 1 ? '' : 's'} · Page {historyPage} of {historyPages}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Search by task or room"
                  className="w-full rounded-2xl border-slate-200 pl-11"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-ink">
                Status
                <select
                  value={historyStatusFilter}
                  onChange={(event) =>
                    setHistoryStatusFilter(event.target.value as 'all' | 'completed' | 'cancelled')
                  }
                  className="rounded-2xl border-slate-200"
                >
                  <option value="all">All states</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>
            <div className="mt-5 grid gap-3">
              {paginatedHistory.length ? (
                paginatedHistory.map((entry) => {
                  const task = allTasks.find((item) => item.id === entry.taskId)

                  return (
                    <div key={entry.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-ink">{entry.taskTitle}</p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            entry.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Coins size={12} />
                          {entry.status === 'cancelled' ? `${entry.points} pts reverted` : `+${entry.points} pts`}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{formatDateTime(entry.completedAt)}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {entry.taskDescription ?? task?.description ?? 'Task details archived from the live board.'}
                      </p>
                      {entry.reversedAt ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                          Cancelled on {formatDateTime(entry.reversedAt)}
                        </p>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No completed tasks match these filters.
                </div>
              )}
            </div>
            {historyPages > 1 ? (
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={historyPage === historyPages}
                  onClick={() => setHistoryPage((current) => Math.min(historyPages, current + 1))}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </Panel>
        </div>
        <Panel className="p-6">
          <h3 className="section-title">Reward redemptions</h3>
          <div className="mt-5 grid gap-3">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="rounded-2xl bg-mist px-4 py-3">
                <p className="inline-flex items-center gap-2 font-semibold text-ink">
                  <Coins size={14} />
                  {redemption.cost} points
                </p>
                <p className="mt-1 text-sm text-slate-500">{formatDateTime(redemption.createdAt)}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Redeemed</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
