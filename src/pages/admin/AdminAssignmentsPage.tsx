import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, ClipboardList, Repeat2, Search, Trash2, UserRound, UserPlus } from 'lucide-react'
import { RoutineAssignmentReassignModal } from '../../components/admin/RoutineAssignmentReassignModal'
import { TaskAssignmentModal } from '../../components/admin/TaskAssignmentModal'
import { Button } from '../../components/common/Button'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { Task } from '../../types/models'
import { formatDate, formatDateTime, formatTimeRange, formatWeekday } from '../../utils/format'

type AssignmentRow = {
  id: string
  kind: 'manual' | 'recurring'
  title: string
  volunteerName: string
  dateLabel: string
  dateValue: string
  statusLabel: string
  detail: string
  schedule: string
  meta?: string
  removeId?: string
  volunteerId?: string
  taskId?: string
}

const isoDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const AdminAssignmentsPage = () => {
  const tasks = useAppStore((state) => state.tasks)
  const users = useAppStore((state) => state.users)
  const routineTasks = useAppStore((state) => state.routineTasks)
  const routineAssignments = useAppStore((state) => state.routineAssignments)
  const activities = useAppStore((state) => state.activities)
  const deleteRoutineAssignment = useAppStore((state) => state.deleteRoutineAssignment)
  const reassignRoutineAssignment = useAppStore((state) => state.reassignRoutineAssignment)
  const assignTask = useAppStore((state) => state.assignTask)
  const unassignTask = useAppStore((state) => state.unassignTask)

  const volunteers = useMemo(
    () => users.filter((user) => user.role === 'volunteer').sort((left, right) => left.name.localeCompare(right.name)),
    [users],
  )

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [volunteerFilter, setVolunteerFilter] = useState('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | 'manual' | 'recurring'>('all')
  const [page, setPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [manualAssignmentTask, setManualAssignmentTask] = useState<Task | null>(null)
  const [recurringAssignmentRow, setRecurringAssignmentRow] = useState<AssignmentRow | null>(null)
  const pageSize = 12
  const historyPageSize = 8

  const assignmentRows = useMemo<AssignmentRow[]>(() => {
    const manualAssignments: AssignmentRow[] = tasks
      .filter(
        (task) =>
          task.audience === 'volunteer' &&
          task.source === 'manual' &&
          ['assigned', 'scheduled'].includes(task.status),
      )
      .map((task) => {
        const volunteer = users.find((user) => user.id === task.assignedTo)
        const startsAt = task.scheduledAt ?? task.publishedAt
        return {
          id: task.id,
          kind: 'manual',
          title: task.title,
          volunteerName: volunteer?.name ?? 'Unassigned',
          dateLabel: formatDateTime(startsAt),
          dateValue: isoDate(startsAt),
          statusLabel: task.status,
          detail: task.description,
          schedule: formatTimeRange(startsAt, task.endsAt),
          meta: task.points ? `${task.points} pts` : undefined,
          volunteerId: task.assignedTo,
          taskId: task.id,
        }
      })

    const recurringAssignmentsRows: AssignmentRow[] = routineAssignments.map((assignment) => {
      const template = routineTasks.find((task) => task.id === assignment.templateId)
      const volunteer = users.find((user) => user.id === assignment.volunteerId)
      const generatedTasks = tasks.filter(
        (task) => task.audience === 'volunteer' && task.routineAssignmentId === assignment.id,
      )
      return {
        id: assignment.id,
        kind: 'recurring',
        title: template?.name ?? 'Recurring task',
        volunteerName: volunteer?.name ?? 'Unknown volunteer',
        dateLabel: `${formatDate(assignment.startsOn)} to ${formatDate(assignment.endsOn)}`,
        dateValue: isoDate(assignment.startsOn),
        statusLabel: `${generatedTasks.length} slots`,
        detail: `${assignment.weekdays.map(formatWeekday).join(', ')} · ${assignment.startTime} - ${assignment.endTime}`,
        schedule: `${assignment.startTime} - ${assignment.endTime}`,
        meta: `${generatedTasks.length} generated task${generatedTasks.length === 1 ? '' : 's'}`,
        removeId: assignment.id,
        volunteerId: assignment.volunteerId,
      }
    })

    return [...manualAssignments, ...recurringAssignmentsRows].sort((left, right) =>
      right.dateValue.localeCompare(left.dateValue),
    )
  }, [routineAssignments, routineTasks, tasks, users])

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return assignmentRows.filter((row) => {
      const matchesType = taskTypeFilter === 'all' || row.kind === taskTypeFilter
      const matchesVolunteer = volunteerFilter === 'all' || row.volunteerName === volunteerFilter
      const matchesDate = !dateFilter || row.dateValue === dateFilter
      const matchesQuery =
        !query ||
        row.title.toLowerCase().includes(query) ||
        row.detail.toLowerCase().includes(query) ||
        row.volunteerName.toLowerCase().includes(query)

      return matchesType && matchesVolunteer && matchesDate && matchesQuery
    })
  }, [assignmentRows, dateFilter, search, taskTypeFilter, volunteerFilter])

  const assignmentHistory = useMemo(() => {
    const query = search.trim().toLowerCase()
    return activities.filter((activity) => {
      if (!['task-taken', 'task-released', 'pack-assigned', 'routine-assigned'].includes(activity.type)) {
        return false
      }

      const matchesType =
        taskTypeFilter === 'all' ||
        (taskTypeFilter === 'manual' &&
          ['task-taken', 'task-released'].includes(activity.type)) ||
        (taskTypeFilter === 'recurring' &&
          ['pack-assigned', 'routine-assigned'].includes(activity.type))

      const activityDate = isoDate(activity.createdAt)
      const normalizedVolunteerFilter = volunteerFilter.toLowerCase()
      const matchesVolunteer =
        volunteerFilter === 'all' ||
        activity.title.toLowerCase().includes(normalizedVolunteerFilter) ||
        activity.description.toLowerCase().includes(normalizedVolunteerFilter)
      const matchesDate = !dateFilter || activityDate === dateFilter
      const matchesQuery =
        !query ||
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query)

      return matchesType && matchesVolunteer && matchesDate && matchesQuery
    })
  }, [activities, dateFilter, search, taskTypeFilter, volunteerFilter])

  useEffect(() => {
    setPage(1)
  }, [dateFilter, search, taskTypeFilter, volunteerFilter])

  useEffect(() => {
    setHistoryPage(1)
  }, [dateFilter, search, taskTypeFilter, volunteerFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize))
  const paginatedAssignments = filteredAssignments.slice((page - 1) * pageSize, page * pageSize)

  const historyPages = Math.max(1, Math.ceil(assignmentHistory.length / historyPageSize))
  const paginatedHistory = assignmentHistory.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize,
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Assignments"
        title="Assignment control"
        description="Review who is handling each task right now, filter quickly, and keep recurring work under control."
      />

      <Panel className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
          <label className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by task, volunteer, or assignment"
              className="w-full rounded-2xl border-slate-200 pl-11"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink">
            Task type
            <select
              value={taskTypeFilter}
              onChange={(event) => setTaskTypeFilter(event.target.value as 'all' | 'manual' | 'recurring')}
              className="rounded-2xl border-slate-200"
            >
              <option value="all">All types</option>
              <option value="manual">Common tasks</option>
              <option value="recurring">Recurring assignments</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink">
            Date
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink">
            Volunteer
            <select
              value={volunteerFilter}
              onChange={(event) => setVolunteerFilter(event.target.value)}
              className="rounded-2xl border-slate-200"
            >
              <option value="all">All volunteers</option>
              {volunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.name}>
                  {volunteer.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      <Panel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-teal" />
            <h3 className="section-title">Current assignments</h3>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            {filteredAssignments.length} result{filteredAssignments.length === 1 ? '' : 's'} · Page {page} of {totalPages}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {paginatedAssignments.length ? (
            paginatedAssignments.map((row) => (
              <div key={`${row.kind}-${row.id}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.kind === 'manual' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.kind === 'manual' ? 'Manual task' : 'Recurring assignment'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {row.statusLabel}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-xl font-semibold text-ink">{row.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{row.detail}</p>
                  </div>

                  {row.removeId ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRecurringAssignmentRow(row)}
                      >
                        <UserPlus size={14} className="mr-2" />
                        Reassign
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const removeId = row.removeId
                          if (!removeId) return
                          if (!window.confirm(`Remove "${row.title}" from ${row.volunteerName}?`)) return
                          void deleteRoutineAssignment(removeId)
                        }}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : row.taskId ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const task = tasks.find((item) => item.id === row.taskId)
                          if (!task) return
                          setManualAssignmentTask(task)
                        }}
                      >
                        <UserPlus size={14} className="mr-2" />
                        Reassign
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!row.taskId) return
                          if (!window.confirm(`Remove "${row.title}" from ${row.volunteerName} and return it to the shared board?`)) return
                          void unassignTask(row.taskId)
                        }}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                  <p className="inline-flex items-center gap-2">
                    <UserRound size={14} />
                    {row.volunteerName}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CalendarRange size={14} />
                    {row.dateLabel}
                  </p>
                  <p>{row.schedule}</p>
                  {row.meta ? <p>{row.meta}</p> : <p>Operational view</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
              No assignments match these filters.
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-5 flex justify-end gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
            </Button>
          </div>
        ) : null}
      </Panel>

      <Panel className="bg-admin p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Repeat2 size={18} className="text-white" />
            <h3 className="font-display text-2xl font-semibold">Assignment history</h3>
          </div>
          <div className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80">
            Page {historyPage} of {historyPages}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {paginatedHistory.length ? (
            paginatedHistory.map((activity) => (
              <div key={activity.id} className="rounded-2xl bg-white/10 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-white">{activity.title}</p>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/55">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/75">{activity.description}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/15 px-4 py-5 text-sm text-white/70">
              No assignment history matches these filters.
            </div>
          )}
        </div>

        {historyPages > 1 ? (
          <div className="mt-5 flex justify-end gap-2">
            <Button size="sm" variant="secondary" disabled={historyPage === 1} onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={historyPage === historyPages} onClick={() => setHistoryPage((current) => Math.min(historyPages, current + 1))}>
              Next
            </Button>
          </div>
        ) : null}
      </Panel>

      <TaskAssignmentModal
        key={manualAssignmentTask?.id ?? 'manual-assignment'}
        open={Boolean(manualAssignmentTask)}
        onClose={() => setManualAssignmentTask(null)}
        task={manualAssignmentTask}
        onSubmit={(volunteerId) => {
          if (!manualAssignmentTask) return
          void assignTask(manualAssignmentTask.id, volunteerId)
        }}
      />

      <RoutineAssignmentReassignModal
        key={recurringAssignmentRow?.id ?? 'recurring-assignment'}
        open={Boolean(recurringAssignmentRow)}
        onClose={() => setRecurringAssignmentRow(null)}
        currentVolunteerId={recurringAssignmentRow?.volunteerId}
        assignmentTitle={recurringAssignmentRow?.title}
        onSubmit={(volunteerId) => {
          if (!recurringAssignmentRow?.removeId) return
          void reassignRoutineAssignment(recurringAssignmentRow.removeId, volunteerId)
        }}
      />
    </div>
  )
}
