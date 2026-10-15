import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Hand, Loader2, MapPin, MessageCircle, Play, RotateCcw, X } from 'lucide-react'
import { getMessengerChatUrl, sendMessengerMessage } from '../../lib/messenger'
import { useAppStore, useCleanerUsers, useSessionUser } from '../../store/app-store'
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
  const cleaners = useCleanerUsers()
  const takeCleaningTask = useAppStore((state) => state.takeCleaningTask)
  const takeOverCleaningTask = useAppStore((state) => state.takeOverCleaningTask)
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
  const [justDone, setJustDone] = useState<Array<{ id: string; name: string }>>([])
  const [sendingMsg, setSendingMsg] = useState<{ id: string; name: string } | null>(null)
  const chatUrl = getMessengerChatUrl()

  useEffect(() => {
    localStorage.setItem(storageKey(user?.id), JSON.stringify(inProgress))
  }, [inProgress, user?.id])

  const cleanerName = useMemo(() => new Map(cleaners.map((cleaner) => [cleaner.id, cleaner.name])), [cleaners])

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

  // Tasks held by the rest of the team and not started yet: assigned to
  // someone else and still open. Taking one moves it into my list.
  const teamTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.audience === 'cleaning' &&
          task.assignedTo &&
          task.assignedTo !== user?.id &&
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

  const handleDone = async (task: Task) => {
    const name = roomName(task)
    setBusyId(task.id)
    try {
      await completeCleaningTask(task.id)
    } catch (error) {
      console.warn('Could not complete cleaning task:', error)
      setBusyId(null)
      return
    }
    setBusyId(null)
    setInProgress((current) => current.filter((taskId) => taskId !== task.id))

    // Short confirmation to the same Messenger group used for the bulk
    // broadcast. While it sends, a loader shows instead of the chat card.
    // If the Messenger API is unavailable, the send is skipped and the flow
    // continues normally.
    setSendingMsg({ id: task.id, name })
    try {
      await sendMessengerMessage(`✅ ${name} cleaned`)
    } catch (error) {
      console.warn('Messenger confirmation skipped:', error)
    }
    setSendingMsg(null)
    setJustDone((current) => [{ id: task.id, name }, ...current].slice(0, 5))
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold text-ink">🧹 My list</h2>
        {doneToday > 0 ? (
          <p className="inline-flex shrink-0 items-center gap-1.5 text-base font-semibold text-emerald-700">
            <CheckCircle2 size={18} /> Done: {doneToday}
          </p>
        ) : null}
      </div>

      {sendingMsg ? (
        <div className="flex items-center justify-center gap-3 rounded-[28px] border-2 border-teal bg-teal/10 p-5 shadow-soft">
          <Loader2 size={24} className="animate-spin text-teal" />
          <p className="text-xl font-semibold text-ink">Sending confirmation…</p>
        </div>
      ) : null}

      {justDone.map((done) => (
        <div key={done.id} className="rounded-[28px] border-2 border-emerald-500 bg-emerald-50 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-2xl font-semibold text-emerald-900">{done.name} done ✓</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setJustDone((current) => current.filter((entry) => entry.id !== done.id))}
              className="rounded-2xl bg-white/70 p-2 text-emerald-800"
            >
              <X size={18} />
            </button>
          </div>
          {chatUrl ? (
            <a
              href={chatUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0084ff] text-xl font-bold text-white active:scale-[0.99]"
            >
              <MessageCircle size={22} /> OPEN MESSENGER CHAT
            </a>
          ) : (
            <p className="mt-3 text-base text-emerald-800">Chat link not set yet.</p>
          )}
        </div>
      ))}

      {myTasks.length > 0 ? (
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
                      onClick={() => void handleDone(task)}
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
      ) : (
        <div className="grid gap-4">
          <div className="rounded-[28px] bg-white p-5 text-center shadow-soft">
            <p className="text-xl font-semibold text-ink">Your list is empty</p>
            <p className="mt-1 text-lg text-slate-500">Take a task below to add it to your list.</p>
          </div>

          {teamTasks.map((task) => {
            const busy = busyId === task.id
            const holder = task.assignedTo ? cleanerName.get(task.assignedTo) : undefined
            return (
              <div key={task.id} className="rounded-[28px] bg-white p-5 shadow-soft">
                <p className="font-display text-2xl font-semibold text-ink">{roomName(task)}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1 text-lg text-slate-500">
                  {placeDetail(task) ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={18} /> {placeDetail(task)}
                    </span>
                  ) : null}
                  {holder ? <span className="text-slate-400">· with {holder}</span> : null}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(task.id, () => takeOverCleaningTask(task.id))}
                  className="mt-4 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 text-xl font-bold text-white active:scale-[0.99]"
                >
                  <Hand size={22} /> TAKE
                </button>
              </div>
            )
          })}

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

          {teamTasks.length === 0 && availableTasks.length === 0 ? (
            <div className="rounded-[28px] bg-white p-6 text-center text-lg text-slate-500">
              Nothing to take right now. Good job 👏
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
