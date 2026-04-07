import { useMemo, useState } from 'react'
import { CalendarClock, Pencil, Plus, Search, SendToBack, Trash2, UserPlus } from 'lucide-react'
import { TaskAssignmentModal } from '../../components/admin/TaskAssignmentModal'
import { TaskEditorModal } from '../../components/admin/TaskEditorModal'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { Task } from '../../types/models'
import { formatDateTime, formatTimeRange } from '../../utils/format'

export const AdminTasksPage = () => {
  const tasks = useAppStore((state) => state.tasks)
  const users = useAppStore((state) => state.users)
  const createTask = useAppStore((state) => state.createTask)
  const updateTask = useAppStore((state) => state.updateTask)
  const publishTask = useAppStore((state) => state.publishTask)
  const toggleTaskCancelled = useAppStore((state) => state.toggleTaskCancelled)
  const deleteTask = useAppStore((state) => state.deleteTask)
  const assignTask = useAppStore((state) => state.assignTask)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [assignmentTask, setAssignmentTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.audience !== 'volunteer' || task.source !== 'manual') {
          return false
        }

        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesSearch =
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
      }),
    [search, statusFilter, tasks],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Task ops"
        title="Task management"
        description="A complete view with filters, scheduling, and quick actions."
        action={
          <Button
            onClick={() => {
              setSelectedTask(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} className="mr-2" />
            Create task
          </Button>
        }
      />
      <Panel className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px]">
          <label className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or description"
              className="w-full rounded-2xl border-slate-200 pl-11"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border-slate-200"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Panel>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CalendarClock />}
          title="No tasks match these filters"
          description="Try another status or create a new task to populate the board."
        />
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Panel key={task.id} className="p-5">
              {(() => {
                const assignedVolunteer = users.find((user) => user.id === task.assignedTo)

                return (
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                          {task.category}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-xl font-semibold text-ink">{task.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{task.description}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>{task.points} pts</span>
                        <span>Publishes {formatDateTime(task.publishedAt)}</span>
                        <span>Happens {formatDateTime(task.scheduledAt ?? task.publishedAt)}</span>
                        <span>{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</span>
                        <span>{assignedVolunteer ? `Assigned to ${assignedVolunteer.name}` : 'Unassigned'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setAssignmentTask(task)
                          setAssignmentOpen(true)
                        }}
                      >
                        <UserPlus size={15} className="mr-2" />
                        {assignedVolunteer ? 'Reassign' : 'Assign'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task)
                          setModalOpen(true)
                        }}
                      >
                        <Pencil size={15} className="mr-2" />
                        Edit
                      </Button>
                      {task.status === 'draft' || task.status === 'scheduled' ? (
                        <Button variant="secondary" size="sm" onClick={() => void publishTask(task.id)}>
                          <SendToBack size={15} className="mr-2" />
                          Publish
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => void toggleTaskCancelled(task.id)}>
                        <Trash2 size={15} className="mr-2" />
                        {task.status === 'cancelled' ? 'Reactivate' : 'Disable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!window.confirm(`Delete "${task.title}" permanently?`)) return
                          void deleteTask(task.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })()}
            </Panel>
          ))}
        </div>
      )}

      <TaskEditorModal
        key={`${selectedTask?.id ?? 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={selectedTask}
        onSubmit={(input) => {
          if (selectedTask) {
            void updateTask(selectedTask.id, input)
            return
          }
          void createTask(input)
        }}
      />

      <TaskAssignmentModal
        key={`${assignmentTask?.id ?? 'none'}-${assignmentOpen ? 'open' : 'closed'}`}
        open={assignmentOpen}
        onClose={() => setAssignmentOpen(false)}
        task={assignmentTask}
        onSubmit={(volunteerId) => {
          if (!assignmentTask) return
          void assignTask(assignmentTask.id, volunteerId)
        }}
      />
    </div>
  )
}
