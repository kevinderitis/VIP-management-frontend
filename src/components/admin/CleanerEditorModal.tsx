import { FormEvent, useEffect, useState } from 'react'
import { CleanerDraftInput, User } from '../../types/models'
import { generatePlayfulPassword } from '../../utils/password'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const emptyForm: CleanerDraftInput = {
  name: '',
  email: '',
  username: '',
  password: '',
  title: '',
  shift: 'Morning',
}

const getCleanerForm = (cleaner?: User | null): CleanerDraftInput =>
  cleaner
    ? {
        name: cleaner.name,
        email: cleaner.email ?? '',
        username: cleaner.username,
        password: cleaner.password,
        title: cleaner.title,
        shift: cleaner.shift ?? 'Morning',
      }
    : emptyForm

export const CleanerEditorModal = ({
  open,
  onClose,
  cleaner,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  cleaner?: User | null
  onSubmit: (input: CleanerDraftInput) => void
}) => {
  const [form, setForm] = useState(() => getCleanerForm(cleaner))

  useEffect(() => {
    setForm(getCleanerForm(cleaner))
  }, [cleaner, open])

  const handleGeneratePassword = () => {
    setForm((prev) => ({ ...prev, password: generatePlayfulPassword() }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      ...form,
      email: form.email?.trim().toLowerCase() ?? '',
      username: form.username.trim().toLowerCase(),
      password: form.password.trim(),
      title: form.title.trim(),
      shift: form.shift.trim(),
      name: form.name.trim(),
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={cleaner ? 'Edit cleaner' : 'New cleaner'}>
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
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value.toLowerCase() }))}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Password
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
              <input
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="rounded-2xl border-slate-200"
              />
              <Button type="button" variant="secondary" onClick={handleGeneratePassword}>
                Generate
              </Button>
            </div>
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
          Internal role
          <input
            required
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Email
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value.toLowerCase() }))}
            placeholder="Optional contact email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{cleaner ? 'Save changes' : 'Create cleaner'}</Button>
        </div>
      </form>
    </Modal>
  )
}
