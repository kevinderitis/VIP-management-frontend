import { useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  History,
  Pencil,
  Plus,
  Repeat2,
  Search,
  SendToBack,
  Trash2,
  UserCog,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { RoutineAssignmentModal } from '../../components/admin/RoutineAssignmentModal'
import { RoutineTaskEditorModal } from '../../components/admin/RoutineTaskEditorModal'
import { AdminToolbar } from '../../components/common/AdminToolbar'
import { PriorityBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Modal } from '../../components/common/Modal'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { RoutineTaskTemplate, Weekday } from '../../types/models'
import { formatDate, formatDateTime, formatWeekday, toLocalDateKey } from '../../utils/format'

const weekdayColumns: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const thailandOffsetMs = 7 * 60 * 60 * 1000
const dayMs = 24 * 60 * 60 * 1000

const dateFromKey = (value: string) => new Date(`${value}T00:00:00+07:00`)
const addDays = (dateKey: string, days: number) => toLocalDateKey(new Date(dateFromKey(dateKey).getTime() + days * dayMs))
const thailandWeekdayIndex = (dateKey: string) => new Date(dateFromKey(dateKey).getTime() + thailandOffsetMs).getUTCDay()
const weekStartFor = (value = new Date()) => {
  const dateKey = toLocalDateKey(value)
  const dayIndex = thailandWeekdayIndex(dateKey)
  const diff = dayIndex === 0 ? -6 : 1 - dayIndex
  return addDays(dateKey, diff)
}

const assignmentMatchesDate = (assignment: { startsOn: string; endsOn: string; weekdays: Weekday[] }, dateKey: string, weekday: Weekday) =>
  toLocalDateKey(assignment.startsOn) <= dateKey &&
  toLocalDateKey(assignment.endsOn) >= dateKey &&
  assignment.weekdays.includes(weekday)

export const AdminRoutineTasksPage = () => {
  const routineTasks = useAppStore((state) => state.routineTasks)
  const routineAssignments = useAppStore((state) => state.routineAssignments)
  const taskHistory = useAppStore((state) => state.taskHistory)
  const users = useAppStore((state) => state.users)
  const createRoutineTask = useAppStore((state) => state.createRoutineTask)
  const updateRoutineTask = useAppStore((state) => state.updateRoutineTask)
  const toggleRoutineTask = useAppStore((state) => state.toggleRoutineTask)
  const deleteRoutineTask = useAppStore((state) => state.deleteRoutineTask)
  const assignRoutineTask = useAppStore((state) => state.assignRoutineTask)
  const [search, setSearch] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedRoutineTask, setSelectedRoutineTask] = useState<RoutineTaskTemplate | null>(null)
  const [openManageId, setOpenManageId] = useState<string | null>(null)
  const [calendarWeekStart, setCalendarWeekStart] = useState(weekStartFor)
  const [calendarTaskId, setCalendarTaskId] = useState<string | null>(null)
  const [calendarWeekdays, setCalendarWeekdays] = useState<Weekday[]>([])
  const [calendarAssignOpen, setCalendarAssignOpen] = useState(false)
  const [calendarVolunteerId, setCalendarVolunteerId] = useState('')
  const [calendarStartTime, setCalendarStartTime] = useState('08:00')
  const [calendarEndTime, setCalendarEndTime] = useState('10:00')
  const [expandedHistoryTaskId, setExpandedHistoryTaskId] = useState<string | null>(null)
  const [historyPagesByTask, setHistoryPagesByTask] = useState<Record<string, number>>({})

  const volunteers = useMemo(
    () => users.filter((user) => user.role === 'volunteer' && user.isActive).sort((left, right) => left.name.localeCompare(right.name)),
    [users],
  )

  const filteredTasks = useMemo(
    () =>
      routineTasks.filter((task) =>
        [task.name, task.description, task.category].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [routineTasks, search],
  )
  const calendarWeekDates = useMemo(
    () => weekdayColumns.map((weekday, index) => ({ weekday, dateKey: addDays(calendarWeekStart, index) })),
    [calendarWeekStart],
  )
  const selectedCalendarTask = routineTasks.find((task) => task.id === calendarTaskId)
  const selectedCalendarDates = calendarWeekDates.filter((item) => calendarWeekdays.includes(item.weekday))
  const selectedStartDate = selectedCalendarDates[0]?.dateKey
  const selectedEndDate = selectedCalendarDates[selectedCalendarDates.length - 1]?.dateKey
  const effectiveCalendarVolunteerId = calendarVolunteerId || volunteers[0]?.id || ''

  const toggleCalendarCell = (taskId: string, weekday: Weekday) => {
    if (calendarTaskId && calendarTaskId !== taskId) return

    if (!calendarTaskId) {
      setCalendarTaskId(taskId)
      setCalendarWeekdays([weekday])
      return
    }

    setCalendarWeekdays((currentWeekdays) => {
      const nextWeekdays = currentWeekdays.includes(weekday)
        ? currentWeekdays.filter((item) => item !== weekday)
        : [...currentWeekdays, weekday].sort(
            (left, right) => weekdayColumns.indexOf(left) - weekdayColumns.indexOf(right),
          )

      if (nextWeekdays.length === 0) {
        setCalendarTaskId(null)
      }

      return nextWeekdays
    })
  }

  const clearCalendarSelection = () => {
    setCalendarTaskId(null)
    setCalendarWeekdays([])
    setCalendarAssignOpen(false)
  }

  const assignCalendarSelection = () => {
    if (!calendarTaskId || !effectiveCalendarVolunteerId || !selectedStartDate || !selectedEndDate || !calendarWeekdays.length) return

    void assignRoutineTask(
      calendarTaskId,
      effectiveCalendarVolunteerId,
      selectedStartDate,
      selectedEndDate,
      calendarWeekdays,
      calendarStartTime,
      calendarEndTime,
    )
    clearCalendarSelection()
  }

  const historyPageFor = (taskId: string) => historyPagesByTask[taskId] ?? 1

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Recurring ops"
        title="Recurring task library"
        description="Reusable task templates that can be assigned to a volunteer by date range, selected weekdays, and time window."
        action={
          <Button
            onClick={() => {
              setSelectedRoutineTask(null)
              setEditorOpen(true)
            }}
          >
            <Plus size={16} className="mr-2" />
            New recurring task
          </Button>
        }
      />

      <AdminToolbar>
      <Panel className="admin-sticky-toolbar p-4">
        <label className="relative block">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, description, or category"
            className="w-full rounded-2xl border-slate-200 pl-11"
          />
        </label>
      </Panel>
      </AdminToolbar>

      <Panel className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-mist p-2 text-teal">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="section-title">Weekly assignment calendar</h3>
              <p className="mt-1 text-sm text-slate-500">
                Select one or more days in a row, choose a volunteer and time, then assign the recurring activity.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCalendarWeekStart((current) => addDays(current, -7))}>
              <ChevronLeft size={15} className="mr-2" />
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCalendarWeekStart(weekStartFor())}>
              This week
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCalendarWeekStart((current) => addDays(current, 7))}>
              Next
              <ChevronRight size={15} className="ml-2" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          <div className="overflow-x-auto">
            <div className="min-w-[1180px] rounded-[24px] border border-slate-200">
              <div className="grid grid-cols-[240px_repeat(7,minmax(132px,1fr))] border-b border-slate-200 bg-slate-50">
                <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Activity
                </div>
                {calendarWeekDates.map((day) => (
                  <div key={day.weekday} className="border-l border-slate-200 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {formatWeekday(day.weekday).slice(0, 3)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatDate(day.dateKey)}</p>
                  </div>
                ))}
              </div>

              {filteredTasks.map((task) => (
                <div key={task.id} className="grid grid-cols-[240px_repeat(7,minmax(132px,1fr))] border-b border-slate-100 last:border-b-0">
                  <div className="px-4 py-4">
                    <p className="font-semibold text-ink">{task.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{task.points} pts · {task.category}</p>
                  </div>
                  {calendarWeekDates.map((day) => {
                    const selected = calendarTaskId === task.id && calendarWeekdays.includes(day.weekday)
                    const assignmentsForCell = routineAssignments.filter(
                      (assignment) =>
                        assignment.templateId === task.id &&
                        assignmentMatchesDate(assignment, day.dateKey, day.weekday),
                    )

                    return (
                      <button
                        key={`${task.id}-${day.weekday}`}
                        type="button"
                        disabled={!task.isActive}
                        onClick={() => toggleCalendarCell(task.id, day.weekday)}
                        title={calendarTaskId && calendarTaskId !== task.id ? 'Finish the current selection first' : undefined}
                        className={`min-h-[116px] border-l border-slate-100 px-3 py-3 text-left transition ${
                          selected
                            ? 'bg-teal/10 ring-2 ring-inset ring-teal'
                            : task.isActive
                              ? 'bg-white hover:bg-mist'
                              : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {assignmentsForCell.length ? (
                          <div className="grid gap-1.5">
                            {assignmentsForCell.map((assignment) => {
                              const volunteer = users.find((user) => user.id === assignment.volunteerId)
                              return (
                                <div key={assignment.id} className="rounded-xl bg-white px-2 py-1 text-xs shadow-sm">
                                  <p className="truncate font-semibold text-ink">{volunteer?.name ?? 'Unknown'}</p>
                                  <p className="text-slate-500">{assignment.startTime} - {assignment.endTime}</p>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-slate-400">
                            {task.isActive ? 'Tap to select' : 'Inactive'}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">
              {selectedCalendarTask
                ? `${selectedCalendarTask.name} · ${calendarWeekdays.length} selected day${calendarWeekdays.length === 1 ? '' : 's'}`
                : 'Select one or more days from a single recurring task.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={clearCalendarSelection} disabled={!calendarWeekdays.length}>
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setCalendarAssignOpen(true)}
                disabled={!calendarTaskId || !calendarWeekdays.length}
              >
                Assign days
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Repeat2 />}
          title="No recurring tasks match this search"
          description="Create reusable recurring templates here, then assign them by date range, weekdays, and time."
        />
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => {
            const fullHistory = taskHistory
              .filter((entry) => entry.routineTemplateId === task.id)
            const historyExpanded = expandedHistoryTaskId === task.id
            const currentHistoryPage = historyPageFor(task.id)
            const historyPages = Math.max(1, Math.ceil(fullHistory.length / 10))
            const history = historyExpanded
              ? fullHistory.slice((currentHistoryPage - 1) * 10, currentHistoryPage * 10)
              : fullHistory.slice(0, 2)
            const activeAssignments = routineAssignments.filter((assignment) => assignment.templateId === task.id)

            return (
              <Panel key={task.id} className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${task.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {task.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                        {task.category}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{task.name}</h3>
                    <p className="mt-2 max-w-3xl text-sm text-slate-500">{task.description}</p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1.5">
                        <CalendarRange size={14} />
                        Reusable recurring template
                      </span>
                      <span>{task.points} pts</span>
                    </div>

                    {task.notes ? (
                      <div className="mt-4 rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {task.notes}
                      </div>
                    ) : null}

                    <div className="mt-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                        <UserRound size={16} />
                        Assigned now
                      </div>
                      {activeAssignments.length ? (
                        <div className="grid gap-2">
                          {activeAssignments.slice(0, 4).map((assignment) => {
                            const volunteer = users.find((user) => user.id === assignment.volunteerId)
                            return (
                              <div key={assignment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="font-semibold text-ink">{volunteer?.name ?? 'Unknown volunteer'}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {assignment.weekdays.map(formatWeekday).join(', ')} · {assignment.startTime} - {assignment.endTime}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {formatDate(assignment.startsOn)} to {formatDate(assignment.endsOn)}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                          This recurring task is not assigned right now.
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                        <History size={16} />
                        Completion history
                      </div>
                      {history.length ? (
                        <>
                          <div className="grid gap-2">
                            {history.map((entry) => {
                              const volunteer = users.find((user) => user.id === entry.volunteerId)
                              return (
                                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                  <div>
                                    <Link
                                      to={`/admin/volunteers/${entry.volunteerId}`}
                                      className="font-semibold text-ink transition hover:text-teal"
                                    >
                                      {volunteer?.name ?? 'Unknown volunteer'}
                                    </Link>
                                    <p className="mt-1 text-sm text-slate-500">{formatDateTime(entry.completedAt)}</p>
                                  </div>
                                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                                    +{entry.points} pts
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          {fullHistory.length > 2 ? (
                            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                              {historyExpanded ? (
                                <>
                                  <span className="text-sm font-medium text-slate-500">
                                    Page {currentHistoryPage} of {historyPages}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={currentHistoryPage === 1}
                                    onClick={() =>
                                      setHistoryPagesByTask((current) => ({
                                        ...current,
                                        [task.id]: Math.max(1, currentHistoryPage - 1),
                                      }))
                                    }
                                  >
                                    Previous
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={currentHistoryPage === historyPages}
                                    onClick={() =>
                                      setHistoryPagesByTask((current) => ({
                                        ...current,
                                        [task.id]: Math.min(historyPages, currentHistoryPage + 1),
                                      }))
                                    }
                                  >
                                    Next
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setExpandedHistoryTaskId(null)
                                      setHistoryPagesByTask((current) => ({ ...current, [task.id]: 1 }))
                                    }}
                                  >
                                    Show less
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setExpandedHistoryTaskId(task.id)
                                    setHistoryPagesByTask((current) => ({ ...current, [task.id]: 1 }))
                                  }}
                                >
                                  Show all history
                                </Button>
                              )}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                          No one has completed this standard task yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:hidden">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedRoutineTask(task)
                          setAssignOpen(true)
                        }}
                      >
                        <SendToBack size={15} className="mr-2" />
                        Assign
                      </Button>
                      <div>
                        <Button
                          type="button"
                          variant="secondary"
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
                              className="w-full"
                              onClick={() => {
                                setSelectedRoutineTask(task)
                                setEditorOpen(true)
                              }}
                            >
                              <Pencil size={15} className="mr-2" />
                              Edit
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => toggleRoutineTask(task.id)}>
                              <UserRound size={15} className="mr-2" />
                              {task.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => {
                                if (!window.confirm(`Delete "${task.name}" permanently?`)) return
                                void deleteRoutineTask(task.id)
                              }}
                            >
                              <Trash2 size={15} className="mr-2" />
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="hidden flex-wrap gap-2 xl:w-[240px] xl:flex-col sm:flex">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedRoutineTask(task)
                        setAssignOpen(true)
                      }}
                    >
                      <SendToBack size={15} className="mr-2" />
                      Assign date range
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedRoutineTask(task)
                        setEditorOpen(true)
                      }}
                    >
                      <Pencil size={15} className="mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => toggleRoutineTask(task.id)}>
                      <UserRound size={15} className="mr-2" />
                      {task.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (!window.confirm(`Delete "${task.name}" permanently?`)) return
                        void deleteRoutineTask(task.id)
                      }}
                    >
                      <Trash2 size={15} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <RoutineTaskEditorModal
        key={`${selectedRoutineTask?.id ?? 'new'}-${editorOpen ? 'open' : 'closed'}`}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        routineTask={selectedRoutineTask}
        onSubmit={(input) => {
          if (selectedRoutineTask) {
            updateRoutineTask(selectedRoutineTask.id, input)
            return
          }
          createRoutineTask(input)
        }}
      />

      <Modal
        open={calendarAssignOpen}
        onClose={() => setCalendarAssignOpen(false)}
        title="Assign selected days"
        description="Create a recurring assignment for the selected days of this week."
      >
        <div className="grid gap-4">
          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="font-semibold text-ink">{selectedCalendarTask?.name ?? 'Recurring task'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCalendarDates.map((day) => (
                <span key={day.weekday} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {formatWeekday(day.weekday)} · {formatDate(day.dateKey)}
                </span>
              ))}
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium text-ink">
            Volunteer
            <select
              value={effectiveCalendarVolunteerId}
              onChange={(event) => setCalendarVolunteerId(event.target.value)}
              className="rounded-2xl border-slate-200"
            >
              {volunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.id}>
                  {volunteer.name} · {volunteer.shift}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-ink">
              Start time
              <input
                type="time"
                value={calendarStartTime}
                onChange={(event) => setCalendarStartTime(event.target.value)}
                className="rounded-2xl border-slate-200"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              End time
              <input
                type="time"
                value={calendarEndTime}
                onChange={(event) => setCalendarEndTime(event.target.value)}
                className="rounded-2xl border-slate-200"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCalendarAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={assignCalendarSelection}
              disabled={!calendarTaskId || !effectiveCalendarVolunteerId || !calendarWeekdays.length}
            >
              Assign days
            </Button>
          </div>
        </div>
      </Modal>

      <RoutineAssignmentModal
        key={`${selectedRoutineTask?.id ?? 'new'}-${assignOpen ? 'open' : 'closed'}`}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        routineTask={selectedRoutineTask}
        onSubmit={(volunteerId, startsOn, endsOn, weekdays, startTime, endTime) => {
          if (!selectedRoutineTask) return
          assignRoutineTask(selectedRoutineTask.id, volunteerId, startsOn, endsOn, weekdays, startTime, endTime)
        }}
      />
    </div>
  )
}
