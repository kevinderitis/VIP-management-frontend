import { BellRing, TimerReset } from 'lucide-react'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { formatDateTime, formatTimeRange } from '../../utils/format'

export const AdminMonitorPage = () => {
  const tasks = useAppStore((state) => state.tasks)
  const activities = useAppStore((state) => state.activities)
  const users = useAppStore((state) => state.users)

  const grouped = {
    available: tasks.filter((task) => task.audience === 'volunteer' && task.status === 'available'),
    assigned: tasks.filter((task) => task.audience === 'volunteer' && task.status === 'assigned'),
    scheduled: tasks.filter((task) => task.audience === 'volunteer' && task.status === 'scheduled'),
    completed: tasks.filter((task) => task.audience === 'volunteer' && task.status === 'completed'),
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Backoffice monitor"
        title="System-wide monitor"
        description="A live view for task status, automatic publishing, and recent activity."
      />
      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {Object.entries(grouped).map(([label, items]) => (
          <Panel key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold capitalize text-ink">{label}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{items.length}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {items.slice(0, 4).map((task) => (
                <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(task.scheduledAt ?? task.publishedAt)}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {task.assignedTo
                      ? `Assigned to ${users.find((user) => user.id === task.assignedTo)?.name ?? 'Volunteer'}`
                      : 'Unassigned'}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      <Panel className="p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-mist p-3 text-teal">
            <BellRing size={18} />
          </div>
          <div>
            <h3 className="section-title">Operations feed</h3>
            <p className="text-sm text-slate-500">Recent operational activity across tasks, assignments, and rewards.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {activities.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-[24px] border border-slate-200 p-4">
              <div className="rounded-2xl bg-ink/5 p-3 text-ink">
                <TimerReset size={18} />
              </div>
              <div>
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{formatDateTime(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
