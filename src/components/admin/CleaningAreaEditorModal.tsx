import { FormEvent, useState } from 'react'
import { CleaningArea } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export const CleaningAreaEditorModal = ({
  open,
  onClose,
  area,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  area?: CleaningArea | null
  onSubmit: (name: string) => void
}) => {
  const [name, setName] = useState(area?.name ?? '')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim())
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={area ? 'Edit custom location' : 'New custom location'}
      description="Add custom places like rooftop laundry, yoga deck, or storage aisle."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Location name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{area ? 'Save changes' : 'Create location'}</Button>
        </div>
      </form>
    </Modal>
  )
}
