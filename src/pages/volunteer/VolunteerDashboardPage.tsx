import { useMemo } from 'react'
import { Award, Coins, Gift, Trophy } from 'lucide-react'
import { Panel } from '../../components/common/Panel'
import { ProgressBar } from '../../components/common/ProgressBar'
import { useAppStore, useSessionUser, useVolunteerUsers } from '../../store/app-store'

export const VolunteerDashboardPage = () => {
  const user = useSessionUser()
  const tasks = useAppStore((state) => state.tasks)
  const allRewards = useAppStore((state) => state.rewards)
  const activities = useAppStore((state) => state.activities)
  const volunteerUsers = useVolunteerUsers()
  const rewards = useMemo(
    () => allRewards.filter((reward) => reward.isActive),
    [allRewards],
  )
  const availableTasksCount = useMemo(
    () => tasks.filter((task) => task.status === 'available').length,
    [tasks],
  )
  const myTasksCount = useMemo(
    () =>
      tasks.filter((task) => task.assignedTo === user?.id && ['assigned', 'scheduled'].includes(task.status)).length,
    [tasks, user?.id],
  )
  const nextReward = useMemo(
    () =>
      [...rewards]
        .sort((a, b) => a.cost - b.cost)
        .find((reward) => reward.cost >= (user?.points ?? 0)),
    [rewards, user?.points],
  )
  const leaderboard = useMemo(
    () => [...volunteerUsers].sort((a, b) => b.lifetimePoints - a.lifetimePoints).slice(0, 4),
    [volunteerUsers],
  )

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-teal">Quick overview</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
            Everything is ready for your next task block
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Available</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{availableTasksCount}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">My active tasks</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{myTasksCount}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{user?.completedTasks ?? 0}</p>
            </div>
          </div>
        </Panel>
        <Panel className="bg-admin p-6 text-white">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/60">
            <Trophy size={14} />
            Soft motivation
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold">You are close to your next reward</h2>
          <p className="mt-3 text-sm text-white/75">
            {nextReward
              ? `You need ${Math.max(nextReward.cost - (user?.points ?? 0), 0)} more points for ${nextReward.name}.`
              : 'You have already reached the highest reward range in the current catalog.'}
          </p>
          <ProgressBar value={user?.points ?? 0} max={nextReward?.cost ?? 320} className="mt-5 bg-white/20" />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-teal" />
            <h3 className="section-title">Recent activity</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {activities.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl bg-mist px-4 py-3">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-teal" />
              <h3 className="section-title">Friendly leaderboard</h3>
            </div>
            <div className="mt-5 grid gap-3">
              {leaderboard.map((volunteer, index) => (
                <div key={volunteer.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-ink">#{index + 1} {volunteer.name}</p>
                    <p className="text-sm text-slate-500">
                      {volunteer.badge} · {volunteer.lifetimePoints} earned all-time
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Coins size={12} />
                    {volunteer.lifetimePoints}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
