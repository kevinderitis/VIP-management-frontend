import { FormEvent, useState } from 'react'
import { CleaningPlaceStatus, CleaningPlaceStatusDraftInput, User } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const presets = [
  { label: 'Clean', color: '#22c55e' },
  { label: 'Needs cleaning', color: '#ef4444' },
  { label: 'In progress', color: '#3b82f6' },
]

export const CleaningPlaceStatusModal = ({
  open,
  onClose,
  place,
  currentStatus,
  cleaners,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  place: Omit<CleaningPlaceStatusDraftInput, 'label' | 'color'>
  currentStatus?: CleaningPlaceStatus
  cleaners: User[]
  onSubmit: (input: CleaningPlaceStatusDraftInput) => void
}) => {
  const [label, setLabel] = useState(currentStatus?.label ?? 'Clean')
  const [color, setColor] = useState(currentStatus?.color ?? '#22c55e')
  const [assignCleanerId, setAssignCleanerId] = useState('')
  const needsCleaning = ['need cleaning', 'needs cleaning'].includes(label.trim().toLowerCase())

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      ...place,
      label,
      color,
      assignCleanerId: needsCleaning && assignCleanerId ? assignCleanerId : undefined,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Place status"
      description={`Choose a status and color for ${place.placeLabel}.`}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setLabel(preset.label)
                setColor(preset.color)
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.color }} />
                <span className="text-sm font-semibold text-ink">{preset.label}</span>
              </div>
            </button>
          ))}
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Status label
          <input
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Color
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            <span className="font-mono text-sm text-slate-500">{color}</span>
          </div>
        </label>
        {needsCleaning ? (
          <label className="grid gap-2 text-sm font-medium text-ink">
            Assign to cleaner
            <select
              value={assignCleanerId}
              onChange={(event) => setAssignCleanerId(event.target.value)}
              className="rounded-2xl border-slate-200"
            >
              <option value="">Leave unassigned</option>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-slate-500">
              Optional. If selected, the cleaning task will be assigned right away.
            </span>
          </label>
        ) : null}
        <div className="rounded-[24px] bg-mist px-4 py-4 text-sm text-slate-600">
          Setting a place to Need cleaning will create or republish a cleaning task automatically.
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save status</Button>
        </div>
      </form>
    </Modal>
  )
}
