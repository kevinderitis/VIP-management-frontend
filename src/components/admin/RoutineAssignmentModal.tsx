import { FormEvent, useMemo, useState } from 'react'
import { RoutineTaskTemplate, Weekday } from '../../types/models'
import { useVolunteerUsers } from '../../store/app-store'
import { formatWeekday, toLocalDateKey } from '../../utils/format'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const toDateInput = (value = new Date()) => toLocalDateKey(value)

export const RoutineAssignmentModal = ({
  open,
  onClose,
  routineTask,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  routineTask?: RoutineTaskTemplate | null
  onSubmit: (
    volunteerId: string,
    startsOn: string,
    endsOn: string,
    weekdays: Weekday[],
    startTime: string,
    endTime: string,
  ) => void
}) => {
  const volunteers = useVolunteerUsers()
  const selectableVolunteers = useMemo(
    () => volunteers.filter((volunteer) => volunteer.isActive),
    [volunteers],
  )
  const [volunteerId, setVolunteerId] = useState(selectableVolunteers[0]?.id ?? '')
  const [startsOn, setStartsOn] = useState(toDateInput)
  const [endsOn, setEndsOn] = useState(() => toDateInput(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)))
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>(['monday', 'wednesday', 'friday'])
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('22:00')
  const selectedVolunteer = selectableVolunteers.find((volunteer) => volunteer.id === volunteerId)
  const offDayConflict = selectedVolunteer?.offDay
    ? selectedWeekdays.includes(selectedVolunteer.offDay)
    : false

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!volunteerId) return
    onSubmit(volunteerId, startsOn, endsOn, selectedWeekdays, startTime, endTime)
    onClose()
  }

  const toggleWeekday = (weekday: Weekday) => {
    setSelectedWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((item) => item !== weekday)
        : [...current, weekday],
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign recurring task"
      description={
        routineTask
          ? `Create scheduled instances of "${routineTask.name}" for one volunteer.`
          : 'Choose a volunteer, dates, weekdays, and time.'
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
            {selectableVolunteers.map((volunteer) => (
              <option key={volunteer.id} value={volunteer.id}>
                {volunteer.name} · {volunteer.shift}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            From
            <input
              required
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink">
            To
            <input
              required
              type="date"
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>

        <div className="grid gap-2 text-sm font-medium text-ink">
          Weekdays
          <div className="flex flex-wrap gap-2">
            {weekdays.map((weekday) => {
              const active = selectedWeekdays.includes(weekday)

              return (
                <button
                  key={weekday}
                  type="button"
                  onClick={() => toggleWeekday(weekday)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-ink text-white'
                      : 'border border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {weekday.charAt(0).toUpperCase() + weekday.slice(1, 3)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Start time
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            End time
            <input
              required
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>

        {offDayConflict ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Heads up: {selectedVolunteer?.name} has {formatWeekday(selectedVolunteer?.offDay ?? 'sunday')} as their off day, and this recurring assignment includes that weekday.
          </div>
        ) : null}

        <div className="rounded-[24px] bg-mist p-4 text-sm text-slate-600">
          Each generated date keeps its own task instance. If the volunteer releases one day, only that specific slot returns to the shared board.
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={selectedWeekdays.length === 0}>
            Assign recurring task
          </Button>
        </div>
      </form>
    </Modal>
  )
}
