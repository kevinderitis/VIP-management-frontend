import { FormEvent, useState } from 'react'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { Task, TaskCategory, TaskDraftInput, TaskPriority } from '../../types/models'
import { fromDateTimeLocal, toDateTimeLocal } from '../../utils/format'

const categories: TaskCategory[] = [
  'housekeeping',
  'reception',
  'kitchen',
  'maintenance',
  'events',
  'guest-care',
]
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

const emptyForm: TaskDraftInput = {
  title: '',
  description: '',
  category: 'housekeeping',
  priority: 'medium',
  points: 15,
  volunteerSlots: 1,
  notes: '',
  publishAt: '',
  scheduledAt: '',
  endsAt: '',
}

const getTaskForm = (task?: Task | null): TaskDraftInput =>
  task
    ? {
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        points: task.points,
        volunteerSlots: task.volunteerSlots ?? 1,
        notes: task.notes ?? '',
        publishAt: toDateTimeLocal(task.publishedAt),
        scheduledAt: toDateTimeLocal(task.scheduledAt),
        endsAt: toDateTimeLocal(task.endsAt),
      }
    : emptyForm

export const TaskEditorModal = ({
  open,
  onClose,
  onSubmit,
  task,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: TaskDraftInput) => void
  task?: Task | null
}) => {
  const [form, setForm] = useState<TaskDraftInput>(() => getTaskForm(task))
  const [scheduleError, setScheduleError] = useState('')
  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>(() =>
    task && new Date(task.publishedAt).getTime() > Date.now() ? 'scheduled' : 'now',
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const scheduledAtIso = fromDateTimeLocal(form.scheduledAt)
    const endsAtIso = fromDateTimeLocal(form.endsAt)
    const publishAtIso = fromDateTimeLocal(form.publishAt)

    if (!scheduledAtIso || !endsAtIso) {
      setScheduleError('Start and end date/time are required.')
      return
    }

    if (new Date(endsAtIso).getTime() <= new Date(scheduledAtIso).getTime()) {
      setScheduleError('End time must be later than start time.')
      return
    }

    if (publishMode === 'scheduled') {
      if (!publishAtIso) {
        setScheduleError('Publish date and time are required when scheduling publication.')
        return
      }

      if (new Date(publishAtIso).getTime() > new Date(scheduledAtIso).getTime()) {
        setScheduleError('Publish time must be before the task start time.')
        return
      }
    }

    setScheduleError('')
    onSubmit({
      ...form,
      publishAt: publishMode === 'scheduled' ? publishAtIso : undefined,
      scheduledAt: scheduledAtIso,
      endsAt: endsAtIso,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      description="Create and schedule operational tasks with a clear start and finish window."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-ink">Publication settings</p>
          <p className="mt-1 text-sm text-slate-500">
            Decide when this task becomes visible for volunteers to claim.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setScheduleError('')
                setPublishMode('now')
              }}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                publishMode === 'now'
                  ? 'border-teal-500 bg-teal-50 text-ink shadow-soft'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <p className="text-sm font-semibold">Publish immediately</p>
              <p className="mt-1 text-xs">The task is visible as soon as it is saved.</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setScheduleError('')
                setPublishMode('scheduled')
              }}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                publishMode === 'scheduled'
                  ? 'border-teal-500 bg-teal-50 text-ink shadow-soft'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <p className="text-sm font-semibold">Publish later</p>
              <p className="mt-1 text-xs">Choose the exact moment volunteers can see it.</p>
            </button>
          </div>
          {publishMode === 'scheduled' ? (
            <label className="mt-4 grid gap-2 text-sm font-medium text-ink">
              Publish date and time
              <input
                type="datetime-local"
                required
                value={form.publishAt ?? ''}
                onChange={(event) => {
                  setScheduleError('')
                  setForm((prev) => ({ ...prev, publishAt: event.target.value }))
                }}
                className="rounded-2xl border-slate-200"
              />
            </label>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Title
            <input
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Category
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value as TaskCategory }))
              }
              className="rounded-2xl border-slate-200"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Description
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Priority
            <select
              value={form.priority}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))
              }
              className="rounded-2xl border-slate-200"
            >
              {priorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Points
            <input
              min={1}
              type="number"
              value={form.points}
              onChange={(event) => setForm((prev) => ({ ...prev, points: Number(event.target.value) }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Volunteer slots
            <input
              min={1}
              max={20}
              type="number"
              value={form.volunteerSlots ?? 1}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  volunteerSlots: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink sm:col-span-2">
            Start date and time
            <input
              type="datetime-local"
              required
              value={form.scheduledAt ?? ''}
              onChange={(event) => {
                setScheduleError('')
                setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))
              }}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        {!task && (form.volunteerSlots ?? 1) > 1 ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
            This common task will open {(form.volunteerSlots ?? 1)} separate volunteer spots for the same work.
          </div>
        ) : null}
        {task ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            You can edit volunteer slots here. If you reduce the number, only free slots can be removed.
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-medium text-ink">
          End date and time
          <input
            type="datetime-local"
            required
            value={form.endsAt ?? ''}
            onChange={(event) => {
              setScheduleError('')
              setForm((prev) => ({ ...prev, endsAt: event.target.value }))
            }}
            className="rounded-2xl border-slate-200"
          />
        </label>
        {scheduleError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {scheduleError}
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-medium text-ink">
          Notes
          <textarea
            rows={2}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{task ? 'Save changes' : 'Create task'}</Button>
        </div>
      </form>
    </Modal>
  )
}
