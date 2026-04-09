import { useMemo, useRef, useState } from 'react'
import { CalendarClock, CalendarDays, ChevronDown, Clock3, Repeat2 } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { TaskCard } from '../../components/volunteer/TaskCard'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { formatDate, formatDateTime, formatTimeRange, formatWeekday } from '../../utils/format'

const getLocalDateValue = (value = new Date()) => {
  const offset = value.getTimezoneOffset()
  const localDate = new Date(value.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 10)
}

const getTaskDateValue = (value?: string) => {
  if (!value) return ''
  return getLocalDateValue(new Date(value))
}

export const VolunteerMyTasksPage = () => {
  const user = useSessionUser()
  const allTasks = useAppStore((state) => state.tasks)
  const routineTasks = useAppStore((state) => state.routineTasks)
  const routineAssignments = useAppStore((state) => state.routineAssignments)
  const completeTask = useAppStore((state) => state.completeTask)
  const releaseTask = useAppStore((state) => state.releaseTask)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'date'>('all')
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue)

  const tasks = useMemo(
    () =>
      allTasks.filter(
        (task) =>
          task.audience === 'volunteer' &&
          task.assignedTo === user?.id &&
          ['assigned', 'scheduled'].includes(task.status),
      ),
    [allTasks, user?.id],
  )

  const today = getLocalDateValue()

  const filteredTasks = useMemo(() => {
    if (filterMode === 'all') return tasks
    const targetDate = filterMode === 'today' ? today : selectedDate
    return tasks.filter((task) => getTaskDateValue(task.scheduledAt ?? task.publishedAt) === targetDate)
  }, [filterMode, selectedDate, tasks, today])

  const recurringPlans = useMemo(
    () =>
      routineAssignments
        .filter((assignment) => assignment.volunteerId === user?.id)
        .map((assignment) => {
          const template = routineTasks.find((item) => item.id === assignment.templateId)
          const relatedTasks = allTasks.filter(
            (task) =>
              task.audience === 'volunteer' &&
              task.routineAssignmentId === assignment.id &&
              task.assignedTo === user?.id,
          )
          return {
            id: assignment.id,
            name: template?.name ?? 'Recurring task',
            weekdays: assignment.weekdays,
            timeRange: `${assignment.startTime} - ${assignment.endTime}`,
            startsOn: assignment.startsOn,
            endsOn: assignment.endsOn,
            tasksCount: relatedTasks.length,
            slots: relatedTasks
              .filter((task) => ['assigned', 'scheduled'].includes(task.status))
              .sort(
                (left, right) =>
                  new Date(left.scheduledAt ?? left.publishedAt).getTime() -
                  new Date(right.scheduledAt ?? right.publishedAt).getTime(),
            ),
          }
        }),
    [allTasks, routineAssignments, routineTasks, user?.id],
  )

  const filteredRecurringPlans = useMemo(() => {
    return recurringPlans
      .map((plan) => ({
        ...plan,
        filteredSlots:
          filterMode === 'all'
            ? plan.slots
            : plan.slots.filter(
                (task) =>
                  getTaskDateValue(task.scheduledAt ?? task.publishedAt) ===
                  (filterMode === 'today' ? today : selectedDate),
              ),
      }))
      .filter((plan) => plan.filteredSlots.length > 0)
  }, [filterMode, recurringPlans, selectedDate, today])

  const standaloneTasks = useMemo(
    () => {
      const ownedRoutineAssignmentIds = new Set(
        routineAssignments
          .filter((assignment) => assignment.volunteerId === user?.id)
          .map((assignment) => assignment.id),
      )

      return filteredTasks.filter(
        (task) => !task.routineAssignmentId || !ownedRoutineAssignmentIds.has(task.routineAssignmentId),
      )
    },
    [filteredTasks, routineAssignments, user?.id],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="My schedule"
        title="Active and scheduled tasks"
        description="This includes tasks you claimed yourself plus tasks assigned through packs and recurring weekly plans."
      />
      {recurringPlans.length ? (
        <div className="grid gap-4">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Repeat2 size={18} className="text-teal" />
              <h3 className="section-title">Recurring assignments</h3>
            </div>
            <div className="mt-4 grid gap-3">
              {recurringPlans.length ? (
                recurringPlans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-ink">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {plan.weekdays.map(formatWeekday).join(', ')} · {plan.timeRange}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(plan.startsOn)} to {formatDate(plan.endsOn)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {plan.tasksCount} scheduled task slots
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No recurring task is assigned right now.
                </div>
              )}
            </div>
          </Panel>
        </div>
      ) : null}

      {tasks.length ? (
        <>
          <Panel className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterMode === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setSelectedDate(getLocalDateValue())
                    setFilterMode('all')
                  }}
                >
                  All tasks
                </Button>
                <Button
                  variant={filterMode === 'today' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setSelectedDate(getLocalDateValue())
                    setFilterMode('today')
                  }}
                >
                  Today
                </Button>
                <Button
                  variant={filterMode === 'date' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setFilterMode('date')
                    dateInputRef.current?.showPicker?.()
                    dateInputRef.current?.focus()
                  }}
                >
                  Pick a date
                </Button>
              </div>

              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Browse a specific day
                </p>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-soft">
                  <div className="rounded-2xl bg-mist p-2 text-teal">
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Selected date</p>
                    <p className="mt-1 font-semibold text-ink">{formatDate(selectedDate)}</p>
                  </div>
                </div>
              </div>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value)
                setFilterMode('date')
              }}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </Panel>

          {filteredRecurringPlans.length || standaloneTasks.length ? (
            <div className="grid gap-3">
              {filteredRecurringPlans.map((plan) => (
                <Panel key={plan.id} className="overflow-hidden rounded-[24px]">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                      <div className="rounded-2xl bg-gradient-to-br from-teal to-lagoon p-2.5 text-white shadow-float">
                        <Repeat2 size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            Recurring assignment
                          </span>
                        </div>
                        <h3 className="mt-2 truncate font-display text-lg font-semibold text-ink">{plan.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={13} />
                            {formatDate(plan.startsOn)} to {formatDate(plan.endsOn)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={13} />
                            {plan.timeRange}
                          </span>
                          <span>{plan.weekdays.map(formatWeekday).join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          {plan.filteredSlots.length} slot{plan.filteredSlots.length > 1 ? 's' : ''}
                        </span>
                        <div className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition group-open:rotate-180">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </summary>

                    <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                      <div className="grid gap-3">
                        {plan.filteredSlots.map((task) => (
                          <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-semibold text-ink">{formatDateTime(task.scheduledAt ?? task.publishedAt)}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}
                                </p>
                                <p className="mt-2 text-sm text-slate-500">{task.description}</p>
                              </div>
                              <div className="flex flex-col gap-2 sm:min-w-[180px]">
                                {task.status === 'assigned' && user ? (
                                  <Button size="sm" onClick={() => completeTask(task.id, user.id)}>
                                    Mark as completed
                                  </Button>
                                ) : null}
                                {user ? (
                                  <Button variant="secondary" size="sm" onClick={() => releaseTask(task.id, user.id)}>
                                    Release task
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </Panel>
              ))}

              {standaloneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  actionLabel={task.status === 'assigned' ? 'Mark as completed' : undefined}
                  onAction={task.status === 'assigned' && user ? () => completeTask(task.id, user.id) : undefined}
                  secondaryActionLabel={user ? 'Release task' : undefined}
                  onSecondaryAction={user ? () => releaseTask(task.id, user.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarClock />}
              title="No tasks match this day"
              description={
                filterMode === 'today'
                  ? 'You have no assigned tasks scheduled for today.'
                  : 'Try another date to review the tasks planned for that day.'
              }
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={<CalendarClock />}
          title="You do not have any assigned tasks"
          description="Claim something from the shared board or wait for an admin assignment."
        />
      )}
    </div>
  )
}
