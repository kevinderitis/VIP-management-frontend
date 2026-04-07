import { FormEvent, useState } from 'react'
import { VolunteerDraftInput, User, Weekday } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const emptyForm: VolunteerDraftInput = {
  name: '',
  username: '',
  password: '',
  title: '',
  shift: 'Morning',
  offDay: 'sunday',
  badge: '',
}

const getVolunteerForm = (volunteer?: User | null): VolunteerDraftInput =>
  volunteer
    ? {
        name: volunteer.name,
        email: volunteer.email ?? '',
        username: volunteer.username,
        password: volunteer.password,
        title: volunteer.title,
        shift: volunteer.shift ?? 'Morning',
        offDay: volunteer.offDay ?? 'sunday',
        badge: volunteer.badge ?? '',
      }
    : emptyForm

export const VolunteerEditorModal = ({
  open,
  onClose,
  volunteer,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  volunteer?: User | null
  onSubmit: (input: VolunteerDraftInput) => void
}) => {
  const [form, setForm] = useState(() => getVolunteerForm(volunteer))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={volunteer ? 'Edit volunteer' : 'New volunteer'}>
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
            Username
            <input
              required
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Password
            <input
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Email
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Optional contact email"
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Internal role
            <input
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Shift
            <input
              required
              value={form.shift}
              onChange={(event) => setForm((prev) => ({ ...prev, shift: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Off day
          <select
            value={form.offDay}
            onChange={(event) => setForm((prev) => ({ ...prev, offDay: event.target.value as Weekday }))}
            className="rounded-2xl border-slate-200"
          >
            {weekdays.map((weekday) => (
              <option key={weekday} value={weekday}>
                {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Motivational badge
          <input
            value={form.badge}
            onChange={(event) => setForm((prev) => ({ ...prev, badge: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{volunteer ? 'Save changes' : 'Create volunteer'}</Button>
        </div>
      </form>
    </Modal>
  )
}
