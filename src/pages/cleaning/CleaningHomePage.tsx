import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Hand, MapPin, Play, RotateCcw } from 'lucide-react'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { Task } from '../../types/models'

const roomName = (task: Task) =>
  task.cleaningRoomCode ? `Room ${task.cleaningRoomCode}` : (task.cleaningLocationLabel ?? task.title)

const placeDetail = (task: Task) => {
  const parts: string[] = []
  if (task.cleaningRoomSection) parts.push(task.cleaningRoomSection)
  if (task.cleaningLocationLabel && task.cleaningRoomCode && task.cleaningLocationLabel !== task.cleaningRoomCode) {
    parts.push(task.cleaningLocationLabel)
  }
  return parts.join(' · ')
}

const storageKey = (userId?: string) => `cleaner-in-progress-${userId ?? 'anon'}`

export const CleaningHomePage = () => {
  const user = useSessionUser()
  const tasks = useAppStore((state) => state.tasks)
  const takeCleaningTask = useAppStore((state) => state.takeCleaningTask)
  const releaseCleaningTask = useAppStore((state) => state.releaseCleaningTask)
  const completeCleaningTask = useAppStore((state) => state.completeCleaningTask)

  const [inProgress, setInProgress] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey(user?.id)) ?? '[]') as string[]
    } catch {
      return []
    }
  })
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey(user?.id), JSON.stringify(inProgress))
  }, [inProgress, user?.id])

  const myTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.audience === 'cleaning' &&
          task.assignedTo === user?.id &&
          ['assigned', 'scheduled'].includes(task.status),
      ),
    [tasks, user?.id],
  )

  const availableTasks = useMemo(
    () => tasks.filter((task) => task.audience === 'cleaning' && task.status === 'available'),
    [tasks],
  )

  const doneToday = useMemo(
    () =>
      tasks.filter(
        (task) => task.audience === 'cleaning' && task.assignedTo === user?.id && task.status === 'completed',
      ).length,
    [tasks, user?.id],
  )

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id)
    try {
      await action()
      setInProgress((current) => current.filter((taskId) => taskId !== id))
    } finally {
      setBusyId(null)
    }
  }

  const firstName = user?.name?.split(' ')[0] ?? 'Hi'

  return (
    <div className="grid gap-5">
      {/* Simple greeting */}
      <div className="rounded-[28px] bg-ink p-6 text-white">
        <p className="text-lg text-white/70">Hi, {firstName} 👋</p>
        <p className="mt-1 font-display text-4xl font-semibold">
          {myTasks.length === 0 ? 'No rooms for now' : `${myTasks.length} to clean`}
        </p>
        <p className="mt-2 text-base text-white/70">
          {myTasks.length === 0
            ? 'New rooms will show up here when ready.'
            : 'Tap START, then tap DONE when finished.'}
        </p>
        {doneToday > 0 ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-base font-semibold">
            <CheckCircle2 size={18} /> Done today: {doneToday}
          </p>
        ) : null}
      </div>

      {/* MY ROOMS */}
      <h2 className="font-display text-2xl font-semibold text-ink">🧹 My rooms</h2>
      {myTasks.length === 0 ? (
        <div className="rounded-[28px] border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-xl font-semibold text-ink">No rooms assigned</p>
          <p className="mt-2 text-lg text-slate-500">Check below for available work.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {myTasks.map((task) => {
            const started = inProgress.includes(task.id)
            const busy = busyId === task.id
            return (
              <div
                key={task.id}
                className={`rounded-[28px] border-2 bg-white p-5 shadow-soft ${started ? 'border-teal' : 'border-slate-100'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-3xl font-semibold text-ink">{roomName(task)}</p>
                    {placeDetail(task) ? (
                      <p className="mt-1 flex items-center gap-1 text-lg text-slate-500">
                        <MapPin size={18} /> {placeDetail(task)}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-4 py-2 text-base font-bold ${started ? 'bg-teal/15 text-teal' : 'bg-amber-100 text-amber-800'}`}
                  >
                    {started ? 'STARTED' : 'TO DO'}
                  </span>
                </div>

                {!started ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setInProgress((current) => [...current, task.id])}
                    className="mt-4 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-ink text-xl font-bold text-white active:scale-[0.99]"
                  >
                    <Play size={22} /> START
                  </button>
                ) : (
                  <div className="mt-4 grid gap-2">
                    <div className="rounded-2xl bg-teal/10 p-4 text-lg text-ink">
                      Cleaning now… tap the green button when done.
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(task.id, () => completeCleaningTask(task.id))}
                      className="flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xl font-bold text-white active:scale-[0.99]"
                    >
                      <CheckCircle2 size={22} /> DONE
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(task.id, () => releaseCleaningTask(task.id))}
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-lg font-semibold text-slate-600"
                    >
                      <RotateCcw size={18} /> Give back
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* AVAILABLE */}
      <h2 className="mt-2 font-display text-2xl font-semibold text-ink">📋 Available</h2>
      {availableTasks.length === 0 ? (
        <div className="rounded-[28px] bg-white p-6 text-center text-lg text-slate-500">
          No more work available. Good job 👏
        </div>
      ) : (
        <div className="grid gap-4">
          {availableTasks.map((task) => {
            const busy = busyId === task.id
            return (
              <div key={task.id} className="rounded-[28px] bg-white p-5 shadow-soft">
                <p className="font-display text-2xl font-semibold text-ink">{roomName(task)}</p>
                {placeDetail(task) ? (
                  <p className="mt-1 flex items-center gap-1 text-lg text-slate-500">
                    <MapPin size={18} /> {placeDetail(task)}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(task.id, () => takeCleaningTask(task.id))}
                  className="mt-4 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 text-xl font-bold text-white active:scale-[0.99]"
                >
                  <Hand size={22} /> TAKE
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
