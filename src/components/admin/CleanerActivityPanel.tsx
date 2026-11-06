import { useMemo, useState } from 'react'
import { ChevronDown, Clock, MapPin, MoreVertical, Play, UserMinus, UserRound, Users } from 'lucide-react'
import { Task, User } from '../../types/models'
import { Panel } from '../common/Panel'
import { ChangeCleanerAssignmentModal } from './ChangeCleanerAssignmentModal'
import { RemoveCleanerAssignmentModal, RemovedRoomState } from './RemoveCleanerAssignmentModal'

const roomName = (task: Task) =>
  task.cleaningRoomCode ? `Room ${task.cleaningRoomCode}` : (task.cleaningLocationLabel ?? task.title)

const roomDetail = (task: Task) => {
  const parts: string[] = []
  if (task.cleaningRoomSection) parts.push(task.cleaningRoomSection)
  if (
    task.cleaningLocationLabel &&
    task.cleaningRoomCode &&
    task.cleaningLocationLabel !== task.cleaningRoomCode &&
    task.cleaningLocationLabel !== task.cleaningRoomSection
  ) {
    parts.push(task.cleaningLocationLabel)
  }
  return parts.join(' · ')
}

type CleanerGroup = {
  id: string
  name: string
  tasks: Task[]
  inProgress: Task[]
  pending: Task[]
}

export const CleanerActivityPanel = ({
  tasks,
  cleaners,
  onReassign,
  onRemove,
}: {
  tasks: Task[]
  cleaners: User[]
  onReassign: (taskId: string, cleanerId: string) => Promise<void> | void
  onRemove: (task: Task, state: RemovedRoomState) => Promise<void> | void
}) => {
  const [open, setOpen] = useState(true)
  const [removeTask, setRemoveTask] = useState<Task | null>(null)
  const [changeTask, setChangeTask] = useState<Task | null>(null)
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const groups = useMemo<CleanerGroup[]>(() => {
    const byAssignee = new Map<string, Task[]>()
    for (const task of tasks) {
      if (task.audience !== 'cleaning' || !task.assignedTo) continue
      if (!['assigned', 'scheduled'].includes(task.status)) continue
      const list = byAssignee.get(task.assignedTo) ?? []
      list.push(task)
      byAssignee.set(task.assignedTo, list)
    }

    const cleanerById = new Map(cleaners.map((cleaner) => [cleaner.id, cleaner]))

    return [...byAssignee.entries()]
      .map(([id, assigned]) => {
        const sorted = [...assigned].sort(
          (a, b) => Number(Boolean(b.startedAt)) - Number(Boolean(a.startedAt)),
        )
        return {
          id,
          name: cleanerById.get(id)?.name ?? 'Unknown cleaner',
          tasks: sorted,
          inProgress: sorted.filter((task) => Boolean(task.startedAt)),
          pending: sorted.filter((task) => !task.startedAt),
        }
      })
      .sort(
        (a, b) =>
          b.inProgress.length - a.inProgress.length ||
          b.tasks.length - a.tasks.length ||
          a.name.localeCompare(b.name),
      )
  }, [cleaners, tasks])

  const totalInProgress = groups.reduce((total, group) => total + group.inProgress.length, 0)
  const totalPending = groups.reduce((total, group) => total + group.pending.length, 0)

  const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  const todayWeekday = weekdayKeys[new Date().getDay()]
  const availableCleaners = cleaners.filter(
    (cleaner) => cleaner.isActive && cleaner.offDay !== todayWeekday,
  )
  const offCleaners = cleaners.filter(
    (cleaner) => cleaner.isActive && cleaner.offDay === todayWeekday,
  )

  const removeCleanerName = useMemo(
    () => cleaners.find((cleaner) => cleaner.id === removeTask?.assignedTo)?.name ?? 'this cleaner',
    [cleaners, removeTask?.assignedTo],
  )

  const confirmRemove = async (state: RemovedRoomState) => {
    if (!removeTask || removing) return
    setRemoving(true)
    try {
      await onRemove(removeTask, state)
    } catch (error) {
      console.warn('Could not remove the cleaner assignment:', error)
    } finally {
      setRemoving(false)
      setRemoveTask(null)
    }
  }

  const confirmChange = async (cleanerId: string) => {
    if (!changeTask) return
    try {
      await onReassign(changeTask.id, cleanerId)
    } catch (error) {
      console.warn('Could not change the cleaner assignment:', error)
    } finally {
      setChangeTask(null)
    }
  }

  return (
    <Panel className="p-6">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => setOpen((current) => !current)} className="flex items-center gap-2 text-left">
          <Users size={18} className="text-teal" />
          <h3 className="section-title">Cleaner activity</h3>
          <span className={`rounded-2xl bg-slate-100 p-2 text-slate-500 transition ${open ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </span>
        </button>
        <span className="text-sm text-slate-500">
          {groups.length} cleaner{groups.length === 1 ? '' : 's'}
        </span>
      </div>

      {open ? (
        <>
          <p className="mt-2 text-sm text-slate-500">
            Cleaners with tasks assigned right now, split by the rooms they have started and the ones still pending.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Available today</p>
              <p className="mt-1 text-sm text-emerald-900">
                {availableCleaners.length
                  ? availableCleaners.map((cleaner) => cleaner.name).join(', ')
                  : 'None'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Off today</p>
              <p className="mt-1 text-sm text-slate-700">
                {offCleaners.length
                  ? offCleaners.map((cleaner) => cleaner.name).join(', ')
                  : 'None'}
              </p>
            </div>
          </div>

          {groups.length ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                  <Play size={13} /> {totalInProgress} in progress
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                  <Clock size={13} /> {totalPending} pending
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{group.name}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {group.tasks.length} room{group.tasks.length === 1 ? '' : 's'} assigned
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                          {group.inProgress.length} in progress
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {group.pending.length} pending
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-1.5">
                      {group.tasks.map((task) => {
                        const started = Boolean(task.startedAt)
                        return (
                          <div
                            key={task.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">{roomName(task)}</p>
                              {roomDetail(task) ? (
                                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                                  <MapPin size={12} /> {roomDetail(task)}
                                </p>
                              ) : null}
                            </div>
                            <div className="relative flex shrink-0 items-center gap-1.5">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  started ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {started ? 'In progress' : 'Pending'}
                              </span>
                              <button
                                type="button"
                                title="Room actions"
                                aria-label={`Actions for ${roomName(task)}`}
                                onClick={() => setMenuTaskId(menuTaskId === task.id ? null : task.id)}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:border-teal/40 hover:bg-teal/5 hover:text-teal"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {menuTaskId === task.id ? (
                                <>
                                  <button
                                    type="button"
                                    aria-label="Close actions menu"
                                    className="fixed inset-0 z-10 cursor-default"
                                    onClick={() => setMenuTaskId(null)}
                                  />
                                  <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuTaskId(null)
                                        setChangeTask(task)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-slate-50"
                                    >
                                      <UserRound size={16} className="text-slate-500" />
                                      Change cleaner
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuTaskId(null)
                                        setRemoveTask(task)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                    >
                                      <UserMinus size={16} />
                                      Remove assignment
                                    </button>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
              No cleaner has tasks assigned right now.
            </div>
          )}
        </>
      ) : null}

      <ChangeCleanerAssignmentModal
        key={`${changeTask?.id ?? 'none'}-${changeTask ? 'open' : 'closed'}`}
        open={Boolean(changeTask)}
        onClose={() => setChangeTask(null)}
        task={changeTask}
        cleaners={cleaners}
        onConfirm={confirmChange}
      />

      <RemoveCleanerAssignmentModal
        open={Boolean(removeTask)}
        onClose={() => setRemoveTask(null)}
        task={removeTask}
        cleanerName={removeCleanerName}
        onConfirm={confirmRemove}
      />
    </Panel>
  )
}
