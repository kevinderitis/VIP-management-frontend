import { useMemo, useState } from 'react'
import { CalendarRange, History, Pencil, Plus, Repeat2, Search, SendToBack, Trash2, UserCog, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RoutineAssignmentModal } from '../../components/admin/RoutineAssignmentModal'
import { RoutineTaskEditorModal } from '../../components/admin/RoutineTaskEditorModal'
import { PriorityBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { RoutineTaskTemplate } from '../../types/models'
import { formatDate, formatDateTime, formatWeekday } from '../../utils/format'

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

  const filteredTasks = useMemo(
    () =>
      routineTasks.filter((task) =>
        [task.name, task.description, task.category].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [routineTasks, search],
  )

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

      <Panel className="p-4">
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

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Repeat2 />}
          title="No recurring tasks match this search"
          description="Create reusable recurring templates here, then assign them by date range, weekdays, and time."
        />
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => {
            const history = taskHistory
              .filter((entry) => entry.routineTemplateId === task.id)
              .slice(0, 4)
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
