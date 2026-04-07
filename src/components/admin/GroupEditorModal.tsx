import { FormEvent, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { emptyTemplateTask } from '../../store/app-store'
import { TaskCategory, TaskGroup, TaskGroupDraftInput, TaskGroupTemplate, TaskPriority } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const categories: TaskCategory[] = ['housekeeping', 'reception', 'kitchen', 'maintenance', 'events', 'guest-care']
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

const emptyForm: TaskGroupDraftInput = {
  name: '',
  description: '',
  durationDays: 3,
  templates: [emptyTemplateTask()],
}

const getGroupForm = (group?: TaskGroup | null): TaskGroupDraftInput =>
  group
    ? {
        name: group.name,
        description: group.description,
        durationDays: group.durationDays,
        templates: group.templates,
      }
    : emptyForm

export const GroupEditorModal = ({
  open,
  onClose,
  group,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  group?: TaskGroup | null
  onSubmit: (input: TaskGroupDraftInput) => void
}) => {
  const [form, setForm] = useState<TaskGroupDraftInput>(() => getGroupForm(group))

  const updateTemplate = (templateId: string, patch: Partial<TaskGroupTemplate>) => {
    setForm((prev) => ({
      ...prev,
      templates: prev.templates.map((template) =>
        template.id === templateId ? { ...template, ...patch } : template,
      ),
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={group ? 'Edit task pack' : 'New task pack'}>
      <form onSubmit={handleSubmit} className="grid gap-5">
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
            Number of days
            <input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(event) => setForm((prev) => ({ ...prev, durationDays: Number(event.target.value) }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Description
          <textarea
            rows={2}
            required
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="grid gap-4">
          {form.templates.map((template, index) => (
            <div key={template.id} className="rounded-[24px] border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-ink">Task #{index + 1}</p>
                {form.templates.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        templates: prev.templates.filter((item) => item.id !== template.id),
                      }))
                    }
                    className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  placeholder="Title"
                  value={template.title}
                  onChange={(event) => updateTemplate(template.id, { title: event.target.value })}
                  className="rounded-2xl border-slate-200"
                />
                <input
                  placeholder="Description"
                  value={template.description}
                  onChange={(event) => updateTemplate(template.id, { description: event.target.value })}
                  className="rounded-2xl border-slate-200"
                />
                <select
                  value={template.category}
                  onChange={(event) =>
                    updateTemplate(template.id, { category: event.target.value as TaskCategory })
                  }
                  className="rounded-2xl border-slate-200"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={template.priority}
                  onChange={(event) =>
                    updateTemplate(template.id, { priority: event.target.value as TaskPriority })
                  }
                  className="rounded-2xl border-slate-200"
                >
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  placeholder="Day"
                  value={template.dayOffset}
                  onChange={(event) => updateTemplate(template.id, { dayOffset: Number(event.target.value) })}
                  className="rounded-2xl border-slate-200"
                />
                <input
                  type="time"
                  value={template.startTime}
                  onChange={(event) => updateTemplate(template.id, { startTime: event.target.value })}
                  className="rounded-2xl border-slate-200"
                />
                <input
                  type="time"
                  value={template.endTime}
                  onChange={(event) => updateTemplate(template.id, { endTime: event.target.value })}
                  className="rounded-2xl border-slate-200"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Points"
                  value={template.points}
                  onChange={(event) => updateTemplate(template.id, { points: Number(event.target.value) })}
                  className="rounded-2xl border-slate-200"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setForm((prev) => ({ ...prev, templates: [...prev.templates, emptyTemplateTask()] }))
            }
            className="justify-center"
          >
            <Plus size={16} className="mr-2" />
            Add task to pack
          </Button>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{group ? 'Save pack' : 'Create pack'}</Button>
        </div>
      </form>
    </Modal>
  )
}
