import { FormEvent, useEffect, useMemo, useState } from 'react'
import { VolunteerDraftInput, User, Weekday } from '../../types/models'
import { generatePlayfulPassword } from '../../utils/password'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

type VolunteerFormErrors = Partial<Record<keyof VolunteerDraftInput, string>>

const validateVolunteerForm = (
  form: VolunteerDraftInput,
  isEditing: boolean,
): VolunteerFormErrors => {
  const errors: VolunteerFormErrors = {}
  const name = form.name.trim()
  const username = form.username.trim()
  const email = form.email?.trim() ?? ''
  const title = form.title.trim()
  const shift = form.shift.trim()
  const password = form.password.trim()

  if (!name) {
    errors.name = 'Name is required.'
  } else if (name.length < 2) {
    errors.name = 'Name must have at least 2 characters.'
  }

  if (!username) {
    errors.username = 'Username is required.'
  } else if (username.length < 3) {
    errors.username = 'Username must have at least 3 characters.'
  } else if (!/^[a-z0-9._-]+$/i.test(username)) {
    errors.username = 'Use only letters, numbers, dots, dashes, or underscores.'
  }

  if (!isEditing || password) {
    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 6) {
      errors.password = 'Password must have at least 6 characters.'
    }
  }

  if (email && !emailPattern.test(email)) {
    errors.email = 'Enter a valid email address or leave it empty.'
  }

  if (!title) {
    errors.title = 'Internal role is required.'
  }

  if (!shift) {
    errors.shift = 'Shift is required.'
  }

  return errors
}

export const VolunteerEditorModal = ({
  open,
  onClose,
  volunteer,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  volunteer?: User | null
  onSubmit: (input: VolunteerDraftInput) => void | Promise<void>
}) => {
  const [form, setForm] = useState<VolunteerDraftInput>(() => getVolunteerForm(volunteer))
  const [errors, setErrors] = useState<VolunteerFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const isEditing = useMemo(() => Boolean(volunteer), [volunteer])

  useEffect(() => {
    setForm(getVolunteerForm(volunteer))
    setErrors({})
    setSubmitError('')
  }, [volunteer, open])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedForm: VolunteerDraftInput = {
      ...form,
      name: form.name.trim(),
      email: form.email?.trim().toLowerCase() ?? '',
      username: form.username.trim().toLowerCase(),
      password: form.password.trim(),
      title: form.title.trim(),
      shift: form.shift.trim(),
      badge: form.badge?.trim() ?? '',
    }

    const nextErrors = validateVolunteerForm(normalizedForm, isEditing)
    setErrors(nextErrors)
    setSubmitError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      await Promise.resolve(onSubmit(normalizedForm))
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this volunteer.')
    }
  }

  const handleFieldChange = <K extends keyof VolunteerDraftInput>(field: K, value: VolunteerDraftInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    setSubmitError('')
  }

  const handleGeneratePassword = () => {
    handleFieldChange('password', generatePlayfulPassword())
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
              onChange={(event) => handleFieldChange('name', event.target.value)}
              className={`rounded-2xl ${errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'}`}
            />
            {errors.name ? <span className="text-xs font-medium text-red-600">{errors.name}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Username
            <input
              required
              value={form.username}
              onChange={(event) => handleFieldChange('username', event.target.value.toLowerCase())}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`rounded-2xl ${errors.username ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'}`}
            />
            {errors.username ? <span className="text-xs font-medium text-red-600">{errors.username}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Password
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
              <input
                required
                value={form.password}
                onChange={(event) => handleFieldChange('password', event.target.value)}
                className={`rounded-2xl ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'}`}
              />
              <Button type="button" variant="secondary" onClick={handleGeneratePassword}>
                Generate
              </Button>
            </div>
            {errors.password ? <span className="text-xs font-medium text-red-600">{errors.password}</span> : null}
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Email
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(event) => handleFieldChange('email', event.target.value.toLowerCase())}
            placeholder="Optional contact email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`rounded-2xl ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'}`}
          />
          {errors.email ? <span className="text-xs font-medium text-red-600">{errors.email}</span> : null}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Internal role
            <input
              required
              value={form.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              className={`rounded-2xl ${errors.title ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'}`}
            />
            {errors.title ? <span className="text-xs font-medium text-red-600">{errors.title}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Shift
            <input
              required
              value={form.shift}
              onChange={(event) => handleFieldChange('shift', event.target.value)}
              className={`rounded-2xl ${errors.shift ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'}`}
            />
            {errors.shift ? <span className="text-xs font-medium text-red-600">{errors.shift}</span> : null}
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
            onChange={(event) => handleFieldChange('badge', event.target.value)}
            className="rounded-2xl border-slate-200"
          />
        </label>
        {submitError ? (
          <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {submitError}
          </div>
        ) : null}
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
