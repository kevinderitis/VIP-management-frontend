import { FormEvent, useMemo, useState } from 'react'
import { useVolunteerUsers } from '../../store/app-store'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export const RoutineAssignmentReassignModal = ({
  open,
  onClose,
  currentVolunteerId,
  assignmentTitle,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  currentVolunteerId?: string
  assignmentTitle?: string
  onSubmit: (volunteerId: string) => void
}) => {
  const volunteers = useVolunteerUsers()
  const activeVolunteers = useMemo(
    () => volunteers.filter((volunteer) => volunteer.isActive),
    [volunteers],
  )
  const [volunteerId, setVolunteerId] = useState(currentVolunteerId ?? activeVolunteers[0]?.id ?? '')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!volunteerId) return
    onSubmit(volunteerId)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reassign recurring assignment"
      description={
        assignmentTitle
          ? `Choose who should now handle "${assignmentTitle}".`
          : 'Choose the volunteer who should now handle this recurring assignment.'
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Volunteer
          <select
            required
            value={volunteerId}
            onChange={(event) => setVolunteerId(event.target.value)}
            className="rounded-2xl border-slate-200"
          >
            {activeVolunteers.map((volunteer) => (
              <option key={volunteer.id} value={volunteer.id}>
                {volunteer.name} · {volunteer.shift}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-[24px] bg-mist p-4 text-sm text-slate-600">
          All upcoming generated task slots from this recurring assignment will move to the selected volunteer.
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save assignment</Button>
        </div>
      </form>
    </Modal>
  )
}
