import { useMemo } from 'react'
import { Activity, CalendarClock, CheckCircle2, ChevronDown, Gift, Users2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { StatCard } from '../../components/common/StatCard'
import { useAppStore, useVolunteerUsers } from '../../store/app-store'
import { formatDateTime } from '../../utils/format'

export const AdminDashboardPage = () => {
  const tasks = useAppStore((state) => state.tasks)
  const activities = useAppStore((state) => state.activities)
  const redemptions = useAppStore((state) => state.redemptions)
  const volunteers = useVolunteerUsers()
  const volunteerTasks = useMemo(
    () => tasks.filter((item) => item.audience === 'volunteer'),
    [tasks],
  )

  const activeVolunteers = volunteers.filter((item) => item.isActive).length
  const availableTasks = volunteerTasks.filter((item) => item.status === 'available').length
  const scheduledTasks = volunteerTasks.filter((item) => item.status === 'scheduled').length
  const completedTasks = volunteerTasks.filter((item) => item.status === 'completed').length
  const totalPoints = volunteers.reduce((sum, volunteer) => sum + volunteer.points, 0)

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Overview"
        title="Everything important in one hostel view"
        description="Fast widgets for daily operations, task visibility, and reward tracking."
      />
      <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
        <StatCard label="Active volunteers" value={activeVolunteers} hint="Ready for assignments" icon={<Users2 size={18} />} />
        <StatCard label="Available tasks" value={availableTasks} hint="Visible to the team" icon={<CalendarClock size={18} />} />
        <StatCard label="Scheduled tasks" value={scheduledTasks} hint="Published automatically by time" icon={<Activity size={18} />} />
        <StatCard label="Completed tasks" value={completedTasks} hint="Closed this season" icon={<CheckCircle2 size={18} />} />
        <StatCard label="Points delivered" value={totalPoints} hint="Motivation layer is active" icon={<Gift size={18} />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <Panel className="p-6">
            <h3 className="section-title">Recent activity</h3>
            <div className="mt-5 grid gap-4">
              {activities.slice(0, 6).map((item) => (
                <div key={item.id} className="flex gap-4 rounded-[24px] bg-slate-50 p-4">
                  <span className="status-dot mt-1 bg-teal animate-pulseDot" />
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="section-title">Volunteers</h3>
              <Link to="/admin/volunteers">
                <Button variant="ghost" size="sm">
                  Open all
                </Button>
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {volunteers.slice(0, 5).map((volunteer) => (
                <details key={volunteer.id} className="group rounded-2xl bg-slate-50 px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{volunteer.name}</p>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${volunteer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {volunteer.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="rounded-2xl bg-white p-2 text-slate-500 transition group-open:rotate-180">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </summary>
                  <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>{volunteer.points} pts</span>
                      <span>{volunteer.completedTasks} completed</span>
                      <span>{volunteer.activeTaskIds.length} active tasks</span>
                    </div>
                    <Link to={`/admin/volunteers/${volunteer.id}`}>
                      <Button variant="secondary" size="sm">
                        View profile
                      </Button>
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          </Panel>
        </div>
        <div className="grid gap-6">
          <Panel className="bg-admin p-6 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Realtime updates</p>
            <h3 className="mt-3 font-display text-3xl font-semibold">Operations overview</h3>
            <p className="mt-3 text-sm text-white/75">
              Scheduled tasks move into availability automatically and every volunteer action updates all views instantly.
            </p>
          </Panel>
          <Panel className="p-6">
            <h3 className="section-title">Recent redemptions</h3>
            <div className="mt-4 grid gap-3">
              {redemptions.slice(0, 5).map((item) => {
                const volunteer = volunteers.find((volunteer) => volunteer.id === item.volunteerId)
                return (
                  <div key={item.id} className="rounded-2xl bg-mist px-4 py-3">
                    <p className="font-semibold text-ink">{volunteer?.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.cost} pts · redeemed</p>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
