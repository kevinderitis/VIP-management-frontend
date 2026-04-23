import { useMemo, useState } from 'react'
import { CalendarClock, Pencil, Plus, Search, SendToBack, Trash2, UserCog, UserPlus } from 'lucide-react'
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
  const [hideRoomTasks, setHideRoomTasks] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [assignmentTask, setAssignmentTask] = useState<Task | null>(null)
  const [openManageId, setOpenManageId] = useState<string | null>(null)

  const filteredTasks = useMemo(() => {
    const visibleTasks = tasks.filter((task) => {
      if (task.audience !== 'volunteer') {
        return false
      }

      if (hideRoomTasks && (task.roomTaskType || task.bedTask || task.cleaningRoomCode)) {
        return false
      }

      if (task.source === 'manual') {
        return true
      }

      return task.source === 'routine' && task.status === 'available'
    })

    const grouped = new Map<
      string,
      {
        task: Task
        effectiveStatus: string
        assignedCount: number
        totalSlots: number
      }
    >()

    visibleTasks.forEach((task) => {
      const key = task.sharedTaskGroupId ?? task.id
      const existing = grouped.get(key)
      if (!existing) {
        grouped.set(key, {
          task,
          effectiveStatus: task.status,
          assignedCount: ['assigned', 'scheduled'].includes(task.status) ? 1 : 0,
          totalSlots: task.sharedTaskGroupId ? task.volunteerSlots ?? 1 : 1,
        })
        return
      }

      existing.assignedCount += ['assigned', 'scheduled'].includes(task.status) ? 1 : 0

      if (task.status === 'available') {
        existing.effectiveStatus = 'available'
        existing.task = task
      } else if (
        existing.effectiveStatus !== 'available' &&
        task.status === 'assigned'
      ) {
        existing.effectiveStatus = 'assigned'
      } else if (
        existing.effectiveStatus !== 'available' &&
        existing.effectiveStatus !== 'assigned' &&
        task.status === 'scheduled'
      ) {
        existing.effectiveStatus = 'scheduled'
      }
    })

    return Array.from(grouped.values())
      .filter(({ task, effectiveStatus }) => {
        const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter
        const matchesSearch =
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
      })
      .map(({ task, assignedCount, totalSlots }) => ({
        ...task,
        status: (task.sharedTaskGroupId
          ? assignedCount >= totalSlots
            ? 'assigned'
            : 'available'
          : task.status) as Task['status'],
        volunteerSlots: totalSlots,
        assignedCount,
      }))
      .sort(
        (left, right) =>
          new Date(right.publishedAt ?? right.scheduledAt ?? 0).getTime() -
          new Date(left.publishedAt ?? left.scheduledAt ?? 0).getTime(),
      )
  }, [hideRoomTasks, search, statusFilter, tasks])

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
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_auto]">
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
          <Button
            type="button"
            variant={hideRoomTasks ? 'secondary' : 'ghost'}
            onClick={() => setHideRoomTasks((current) => !current)}
          >
            {hideRoomTasks ? 'Show room tasks' : 'Hide room tasks'}
          </Button>
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
            <Panel key={task.sharedTaskGroupId ?? task.id} className="p-5">
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
                        {task.volunteerSlots && task.volunteerSlots > 1 ? (
                          <span>
                            {task.assignedCount ?? 0} of {task.volunteerSlots} volunteer spots assigned
                          </span>
                        ) : null}
                        <span>Publishes {formatDateTime(task.publishedAt)}</span>
                        <span>Happens {formatDateTime(task.scheduledAt ?? task.publishedAt)}</span>
                        <span>{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</span>
                        <span>
                          {task.volunteerSlots && task.volunteerSlots > 1
                            ? (task.assignedCount ?? 0) > 0
                              ? 'Multi-volunteer common task'
                              : 'No volunteers assigned yet'
                            : assignedVolunteer
                              ? `Assigned to ${assignedVolunteer.name}`
                              : 'Unassigned'}
                        </span>
                        {task.source === 'routine' ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                            Released recurring slot
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <div className="grid grid-cols-2 gap-2">
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
                        <div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => setOpenManageId(openManageId === task.id ? null : task.id)}
                          >
                            <UserCog size={15} className="mr-2" />
                            Manage
                          </Button>
                          {openManageId === task.id ? (
                            <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedTask(task)
                                  setModalOpen(true)
                                }}
                              >
                                <Pencil size={15} className="mr-2" />
                                Edit
                              </Button>
                              {task.status === 'draft' || task.status === 'scheduled' ? (
                                <Button variant="secondary" size="sm" className="w-full" onClick={() => void publishTask(task.id)}>
                                  <SendToBack size={15} className="mr-2" />
                                  Publish
                                </Button>
                              ) : null}
                              <Button variant="ghost" size="sm" className="w-full" onClick={() => void toggleTaskCancelled(task.id)}>
                                <Trash2 size={15} className="mr-2" />
                                {task.status === 'cancelled' ? 'Reactivate' : 'Disable'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  if (!window.confirm(`Delete "${task.title}" permanently?`)) return
                                  void deleteTask(task.id)
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="hidden flex-wrap gap-2 sm:flex">
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
