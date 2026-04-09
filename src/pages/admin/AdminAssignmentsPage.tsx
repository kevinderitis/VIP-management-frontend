import { useMemo, useState } from 'react'
import { CalendarRange, ClipboardList, Repeat2, Search, Trash2, UserRound } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { formatDate, formatDateTime, formatTimeRange, formatWeekday } from '../../utils/format'

export const AdminAssignmentsPage = () => {
  const tasks = useAppStore((state) => state.tasks)
  const users = useAppStore((state) => state.users)
  const routineTasks = useAppStore((state) => state.routineTasks)
  const routineAssignments = useAppStore((state) => state.routineAssignments)
  const activities = useAppStore((state) => state.activities)
  const deleteRoutineAssignment = useAppStore((state) => state.deleteRoutineAssignment)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const assignedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.audience === 'volunteer' &&
          task.source === 'manual' &&
          ['assigned', 'scheduled'].includes(task.status),
      ),
    [tasks],
  )

  const filteredAssignedTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return assignedTasks
    return assignedTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query),
    )
  }, [assignedTasks, search])

  const recurringAssignments = useMemo(
    () =>
      routineAssignments.map((assignment) => {
        const template = routineTasks.find((task) => task.id === assignment.templateId)
        const volunteer = users.find((user) => user.id === assignment.volunteerId)
        const generatedTasks = tasks.filter(
          (task) => task.audience === 'volunteer' && task.routineAssignmentId === assignment.id,
        )

        return {
          id: assignment.id,
          name: template?.name ?? 'Recurring task',
          volunteerName: volunteer?.name ?? 'Unknown volunteer',
          startsOn: assignment.startsOn,
          endsOn: assignment.endsOn,
          weekdays: assignment.weekdays,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          generatedTasks,
        }
      }),
    [routineAssignments, routineTasks, tasks, users],
  )

  const filteredRecurringAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return recurringAssignments
    return recurringAssignments.filter(
      (assignment) =>
        assignment.name.toLowerCase().includes(query) ||
        assignment.volunteerName.toLowerCase().includes(query),
    )
  }, [recurringAssignments, search])

  const assignmentHistory = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = activities.filter((activity) => {
      if (!['task-taken', 'task-released', 'pack-assigned', 'routine-assigned'].includes(activity.type)) {
        return false
      }

      if (!query) return true
      return (
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query)
      )
    })

    return filtered
  }, [activities, search])

  const totalPages = Math.max(1, Math.ceil(assignmentHistory.length / pageSize))
  const paginatedHistory = useMemo(
    () => assignmentHistory.slice((page - 1) * pageSize, page * pageSize),
    [assignmentHistory, page],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Assignments"
        title="Assignment control"
        description="Track who is responsible for each individual task and each recurring assignment across the hostel."
      />

      <Panel className="p-4">
        <label className="relative block">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Filter by task name, volunteer, or assignment event"
            className="w-full rounded-2xl border-slate-200 pl-11"
          />
        </label>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-teal" />
            <h3 className="section-title">Individual tasks</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {filteredAssignedTasks.length ? (
              filteredAssignedTasks.map((task) => {
                const volunteer = users.find((user) => user.id === task.assignedTo)

                return (
                  <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDateTime(task.scheduledAt ?? task.publishedAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 capitalize">
                        {task.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</span>
                      <span>{task.points} pts</span>
                      <span>{volunteer ? `Assigned to ${volunteer.name}` : 'Unassigned'}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                There are no assigned individual tasks right now.
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center gap-2">
            <Repeat2 size={18} className="text-teal" />
            <h3 className="section-title">Recurring assignments</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {filteredRecurringAssignments.length ? (
              filteredRecurringAssignments.map((assignment) => (
                <details key={assignment.id} className="group rounded-2xl bg-slate-50 px-4 py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{assignment.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{assignment.volunteerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        {assignment.generatedTasks.length} slot{assignment.generatedTasks.length > 1 ? 's' : ''}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          if (!window.confirm(`Remove the recurring assignment "${assignment.name}" for ${assignment.volunteerName}?`)) return
                          void deleteRoutineAssignment(assignment.id)
                        }}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Remove
                      </Button>
                    </div>
                  </summary>

                  <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm text-slate-500">
                    <p className="inline-flex items-center gap-2">
                      <CalendarRange size={14} />
                      {formatDate(assignment.startsOn)} to {formatDate(assignment.endsOn)}
                    </p>
                    <p>{assignment.weekdays.map(formatWeekday).join(', ')} · {assignment.startTime} - {assignment.endTime}</p>
                    <div className="mt-2 grid gap-2">
                      {assignment.generatedTasks.map((task) => (
                        <div key={task.id} className="rounded-2xl bg-white px-3 py-3">
                          <p className="font-medium text-ink">{formatDateTime(task.scheduledAt ?? task.publishedAt)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)} · {task.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                There are no recurring assignments right now.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel className="bg-admin p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserRound size={18} className="text-white" />
              <h3 className="font-display text-2xl font-semibold">Assignment history</h3>
            </div>
            <p className="mt-3 text-sm text-white/75">
              Review task claims, releases, and generated assignment events without overloading the screen.
            </p>
          </div>
          <div className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80">
            Page {page} of {totalPages}
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
              No assignment history matches this filter.
            </div>
          )}
        </div>
        {totalPages > 1 ? (
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/80 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/80 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </Panel>
    </div>
  )
}
