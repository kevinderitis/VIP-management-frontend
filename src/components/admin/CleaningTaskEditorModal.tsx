import { FormEvent, useMemo, useState } from 'react'
import { toDateTimeLocal } from '../../utils/format'
import {
  CleaningArea,
  CleaningTaskDraftInput,
  Task,
  TaskCategory,
  TaskPriority,
} from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const categories: TaskCategory[] = ['housekeeping', 'maintenance', 'guest-care', 'kitchen']
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

const emptyForm: CleaningTaskDraftInput = {
  title: '',
  description: '',
  category: 'housekeeping',
  priority: 'medium',
  notes: '',
  publishAt: '',
  scheduledAt: '',
  endsAt: '',
  cleaningLocationType: 'room',
  cleaningLocationLabel: 'Room 1',
  cleaningRoomNumber: 1,
}

const taskToForm = (task?: Task | null): CleaningTaskDraftInput =>
  task
    ? {
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        notes: task.notes ?? '',
        publishAt: toDateTimeLocal(task.publishedAt),
        scheduledAt: toDateTimeLocal(task.scheduledAt),
        endsAt: toDateTimeLocal(task.endsAt),
        cleaningLocationType: task.cleaningLocationType ?? 'room',
        cleaningLocationLabel: task.cleaningLocationLabel ?? 'Room 1',
        cleaningRoomNumber: task.cleaningRoomNumber ?? 1,
      }
    : emptyForm

export const CleaningTaskEditorModal = ({
  open,
  onClose,
  task,
  customAreas,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  task?: Task | null
  customAreas: CleaningArea[]
  onSubmit: (input: CleaningTaskDraftInput) => void
}) => {
  const [form, setForm] = useState<CleaningTaskDraftInput>(() => taskToForm(task))
  const [scheduleError, setScheduleError] = useState('')
  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>(() =>
    task && new Date(task.publishedAt).getTime() > Date.now() ? 'scheduled' : 'now',
  )

  const availableCustomAreas = useMemo(
    () => customAreas.filter((area) => area.isActive),
    [customAreas],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.scheduledAt || !form.endsAt) {
      setScheduleError('Start and end date/time are required.')
      return
    }

    if (new Date(form.endsAt).getTime() <= new Date(form.scheduledAt).getTime()) {
      setScheduleError('End time must be later than start time.')
      return
    }

    if (publishMode === 'scheduled') {
      if (!form.publishAt) {
        setScheduleError('Publish date and time are required when scheduling publication.')
        return
      }

      if (new Date(form.publishAt).getTime() > new Date(form.scheduledAt).getTime()) {
        setScheduleError('Publish time must be before the task start time.')
        return
      }
    }

    onSubmit({
      ...form,
      publishAt:
        publishMode === 'scheduled' && form.publishAt
          ? new Date(form.publishAt).toISOString()
          : undefined,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit cleaning task' : 'New cleaning task'}
      description="Create cleaning work for a room or custom place and decide when it becomes visible."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-ink">Publication settings</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPublishMode('now')}
              className={`rounded-2xl border px-4 py-3 text-left ${publishMode === 'now' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
            >
              <p className="text-sm font-semibold text-ink">Publish immediately</p>
              <p className="mt-1 text-xs text-slate-500">Show it on the cleaning board right away.</p>
            </button>
            <button
              type="button"
              onClick={() => setPublishMode('scheduled')}
              className={`rounded-2xl border px-4 py-3 text-left ${publishMode === 'scheduled' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
            >
              <p className="text-sm font-semibold text-ink">Publish later</p>
              <p className="mt-1 text-xs text-slate-500">Release it at a specific date and time.</p>
            </button>
          </div>
          {publishMode === 'scheduled' ? (
            <label className="mt-4 grid gap-2 text-sm font-medium text-ink">
              Publish date and time
              <input
                type="datetime-local"
                required
                value={form.publishAt ? toDateTimeLocal(form.publishAt) : ''}
                onChange={(event) => setForm((prev) => ({ ...prev, publishAt: event.target.value }))}
                className="rounded-2xl border-slate-200"
              />
            </label>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Task title
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
            rows={3}
            required
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Location type
            <select
              value={form.cleaningLocationType}
              onChange={(event) => {
                const nextType = event.target.value as CleaningTaskDraftInput['cleaningLocationType']
                const fallbackLabel =
                  nextType === 'room'
                    ? 'Room 1'
                    : availableCustomAreas[0]?.name ?? ''
                setForm((prev) => ({
                  ...prev,
                  cleaningLocationType: nextType,
                  cleaningLocationLabel: fallbackLabel,
                  cleaningRoomNumber: nextType === 'room' ? 1 : undefined,
                }))
              }}
              className="rounded-2xl border-slate-200"
            >
              <option value="room">Room</option>
              <option value="custom">Custom place</option>
            </select>
          </label>
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
        </div>

        {form.cleaningLocationType === 'room' ? (
          <label className="grid gap-2 text-sm font-medium text-ink">
            Room number
            <input
              type="number"
              min={1}
              max={300}
              value={form.cleaningRoomNumber ?? 1}
              onChange={(event) => {
                const roomNumber = Number(event.target.value)
                setForm((prev) => ({
                  ...prev,
                  cleaningRoomNumber: roomNumber,
                  cleaningLocationLabel: `Room ${roomNumber}`,
                }))
              }}
              className="rounded-2xl border-slate-200"
            />
          </label>
        ) : null}

        {form.cleaningLocationType === 'custom' ? (
          <label className="grid gap-2 text-sm font-medium text-ink">
            Custom location
            <select
              value={form.cleaningLocationLabel}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cleaningLocationLabel: event.target.value }))
              }
              className="rounded-2xl border-slate-200"
            >
              {availableCustomAreas.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Start date and time
            <input
              type="datetime-local"
              required
              value={form.scheduledAt ? toDateTimeLocal(form.scheduledAt) : ''}
              onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            End date and time
            <input
              type="datetime-local"
              required
              value={form.endsAt ? toDateTimeLocal(form.endsAt) : ''}
              onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>

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
          <Button type="submit">{task ? 'Save changes' : 'Create cleaning task'}</Button>
        </div>
      </form>
    </Modal>
  )
}
