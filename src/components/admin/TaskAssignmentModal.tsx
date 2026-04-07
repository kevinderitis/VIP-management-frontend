import { FormEvent, useMemo, useState } from 'react'
import { Task } from '../../types/models'
import { useVolunteerUsers } from '../../store/app-store'
import { formatWeekday } from '../../utils/format'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export const TaskAssignmentModal = ({
  open,
  onClose,
  task,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  task?: Task | null
  onSubmit: (volunteerId: string) => void
}) => {
  const volunteers = useVolunteerUsers()
  const activeVolunteers = useMemo(
    () => volunteers.filter((volunteer) => volunteer.isActive),
    [volunteers],
  )
  const [volunteerId, setVolunteerId] = useState(task?.assignedTo ?? activeVolunteers[0]?.id ?? '')
  const selectedVolunteer = activeVolunteers.find((volunteer) => volunteer.id === volunteerId)
  const taskDate = task ? new Date(task.scheduledAt ?? task.publishedAt) : undefined
  const taskWeekday = taskDate ? weekdays[taskDate.getDay()] : undefined
  const offDayConflict =
    selectedVolunteer?.offDay && taskWeekday && selectedVolunteer.offDay === taskWeekday

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
      title={task?.assignedTo ? 'Reassign task' : 'Assign task'}
      description={task ? `Choose who should be responsible for "${task.title}".` : 'Choose a volunteer.'}
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

        {offDayConflict ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Heads up: {selectedVolunteer.name} has {formatWeekday(selectedVolunteer.offDay!)} as their off day, and this task is scheduled for that day.
          </div>
        ) : null}

        <div className="rounded-[24px] bg-mist p-4 text-sm text-slate-600">
          The task will appear in that volunteer's schedule and will still be releasable later if they cannot complete that specific slot.
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{task?.assignedTo ? 'Save assignment' : 'Assign task'}</Button>
        </div>
      </form>
    </Modal>
  )
}
