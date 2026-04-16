import { FormEvent, useMemo, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { useVolunteerUsers } from '../../store/app-store'
import { TaskGroup } from '../../types/models'
import { formatDateTime, formatWeekday, toLocalDateKey } from '../../utils/format'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export const AssignmentModal = ({
  open,
  onClose,
  groups,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  groups: TaskGroup[]
  onSubmit: (groupId: string, volunteerId: string, startDate: string, durationDays: number) => void
}) => {
  const volunteers = useVolunteerUsers()
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [volunteerId, setVolunteerId] = useState(volunteers[0]?.id ?? '')
  const [startDate, setStartDate] = useState(toLocalDateKey(new Date()))
  const [durationDays, setDurationDays] = useState(5)

  const group = groups.find((item) => item.id === groupId)
  const selectedVolunteer = volunteers.find((item) => item.id === volunteerId)

  const preview = useMemo(() => {
    if (!group) return []
    return group.templates.map((template) => {
      const scheduled = new Date(`${startDate}T${template.startTime}:00.000Z`)
      scheduled.setDate(scheduled.getDate() + template.dayOffset - 1)
      return {
        id: template.id,
        title: template.title,
        weekday: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][scheduled.getDay()],
        when: `${formatDateTime(scheduled.toISOString())} · ${template.startTime} - ${template.endTime}`,
        points: template.points,
      }
    })
  }, [group, startDate])

  const offDayConflict = selectedVolunteer?.offDay
    ? preview.some((item) => item.weekday === selectedVolunteer.offDay)
    : false

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(groupId, volunteerId, `${startDate}T08:00:00.000Z`, durationDays)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign pack to season">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Pack
            <select
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              className="rounded-2xl border-slate-200"
            >
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Volunteer
            <select
              value={volunteerId}
              onChange={(event) => setVolunteerId(event.target.value)}
              className="rounded-2xl border-slate-200"
            >
              {volunteers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Duration
            <input
              min={1}
              type="number"
              value={durationDays}
              onChange={(event) => setDurationDays(Number(event.target.value))}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        <div className="rounded-[24px] bg-mist p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarRange size={16} />
            Preview of generated tasks
          </div>
          <div className="grid gap-3">
            {preview.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.when}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {item.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
        {offDayConflict ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Heads up: {selectedVolunteer?.name} has {formatWeekday(selectedVolunteer?.offDay ?? 'sunday')} as their off day, and this pack preview includes tasks on that day.
          </div>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Assign pack</Button>
        </div>
      </form>
    </Modal>
  )
}
