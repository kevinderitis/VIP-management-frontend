import { FormEvent, useState } from 'react'
import {
  RoutineTaskDraftInput,
  RoutineTaskTemplate,
  TaskCategory,
  TaskPriority,
} from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const categories: TaskCategory[] = [
  'housekeeping',
  'reception',
  'kitchen',
  'maintenance',
  'events',
  'guest-care',
]

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

const emptyForm: RoutineTaskDraftInput = {
  name: '',
  description: '',
  category: 'housekeeping',
  priority: 'medium',
  points: 15,
  notes: '',
}

const getFormValues = (task?: RoutineTaskTemplate | null): RoutineTaskDraftInput =>
  task
    ? {
        name: task.name,
        description: task.description,
        category: task.category,
        priority: task.priority,
        points: task.points,
        notes: task.notes ?? '',
      }
    : emptyForm

export const RoutineTaskEditorModal = ({
  open,
  onClose,
  routineTask,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  routineTask?: RoutineTaskTemplate | null
  onSubmit: (input: RoutineTaskDraftInput) => void
}) => {
  const [form, setForm] = useState<RoutineTaskDraftInput>(() => getFormValues(routineTask))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={routineTask ? 'Edit recurring task template' : 'New recurring task template'}
      description="Create a reusable task definition that can later be assigned by date range, weekdays, and time window."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Name
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Category
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as TaskCategory }))}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Priority
            <select
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
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
        </div>

        <label className="grid gap-2 text-sm font-medium text-ink">
          Admin notes
          <input
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{routineTask ? 'Save changes' : 'Create standard task'}</Button>
        </div>
      </form>
    </Modal>
  )
}
