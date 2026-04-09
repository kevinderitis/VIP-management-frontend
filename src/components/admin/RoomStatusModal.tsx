import { FormEvent, useEffect, useMemo, useState } from 'react'
import { BedStatus, CleaningPlaceStatus, CleaningPlaceStatusDraftInput, CleaningRoom, RoomType, User } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const roomPresets = [
  { label: 'Clean', color: '#22c55e' },
  { label: 'Needs cleaning', color: '#ef4444' },
  { label: 'In progress', color: '#3b82f6' },
]

const bedPresets = [
  { label: 'Ready', color: '#22c55e' },
  { label: 'Needs making', color: '#ef4444' },
  { label: 'Occupied', color: '#3b82f6' },
]

const defaultBed = (bedNumber: number): BedStatus => ({
  bedNumber,
  label: 'Ready',
  color: '#22c55e',
})

export const RoomStatusModal = ({
  open,
  onClose,
  room,
  currentStatus,
  cleaners,
  volunteers,
  roomTasks,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  room: CleaningRoom
  currentStatus?: CleaningPlaceStatus
  cleaners: User[]
  volunteers: User[]
  roomTasks: Array<{
    id: string
    cleaningBedNumber?: number
    assignedTo?: string
    lastAssignedTo?: string
    status: string
    bedTask?: boolean
  }>
  onSubmit: (input: CleaningPlaceStatusDraftInput) => void
}) => {
  const [roomType, setRoomType] = useState<RoomType>(currentStatus?.roomType ?? room.roomType)
  const [roomLabel, setRoomLabel] = useState(currentStatus?.roomServiceLabel ?? currentStatus?.label ?? 'Clean')
  const [roomColor, setRoomColor] = useState(currentStatus?.roomServiceColor ?? currentStatus?.color ?? '#22c55e')
  const [assignCleanerId, setAssignCleanerId] = useState('')
  const [assignVolunteerId, setAssignVolunteerId] = useState('')
  const [bedCount, setBedCount] = useState(Math.max(2, currentStatus?.beds.length ?? room.bedCount))
  const [beds, setBeds] = useState<BedStatus[]>(currentStatus?.beds.length ? currentStatus.beds : [defaultBed(1)])

  useEffect(() => {
    setRoomType(currentStatus?.roomType ?? room.roomType)
    setRoomLabel(currentStatus?.roomServiceLabel ?? currentStatus?.label ?? 'Clean')
    setRoomColor(currentStatus?.roomServiceColor ?? currentStatus?.color ?? '#22c55e')
    setAssignCleanerId('')
    setAssignVolunteerId('')
    setBedCount(Math.max(2, currentStatus?.beds.length ?? room.bedCount))
    setBeds(currentStatus?.beds.length ? currentStatus.beds : [defaultBed(1)])
  }, [currentStatus, room])

  const visibleBeds = useMemo(() => {
    if (roomType === 'private') {
      const privateBed = beds[0] ?? defaultBed(1)
      return [{ ...privateBed, bedNumber: 1 }]
    }

    return Array.from({ length: bedCount }, (_, index) => {
      const bedNumber = index + 1
      return beds.find((bed) => bed.bedNumber === bedNumber) ?? defaultBed(bedNumber)
    })
  }, [bedCount, beds, roomType])

  const updateBed = (bedNumber: number, next: { label: string; color: string }) => {
    setBeds((currentBeds) => {
      const nextBeds = currentBeds.some((bed) => bed.bedNumber === bedNumber)
        ? currentBeds.map((bed) => (bed.bedNumber === bedNumber ? { ...bed, ...next } : bed))
        : [...currentBeds, { bedNumber, ...next }]

      return nextBeds.sort((left, right) => left.bedNumber - right.bedNumber)
    })
  }

  const bedTaskAssignees = useMemo(() => {
    const userMap = new Map(volunteers.map((volunteer) => [volunteer.id, volunteer.name]))
    return visibleBeds.reduce<Record<number, { current?: string; last?: string }>>((accumulator, bed) => {
      const relatedTask = roomTasks.find(
        (task) =>
          task.bedTask &&
          (room.roomType === 'private'
            ? !task.cleaningBedNumber
            : task.cleaningBedNumber === bed.bedNumber),
      )

      if (!relatedTask) return accumulator

      accumulator[bed.bedNumber] = {
        current: relatedTask.assignedTo ? userMap.get(relatedTask.assignedTo) : undefined,
        last: relatedTask.lastAssignedTo ? userMap.get(relatedTask.lastAssignedTo) : undefined,
      }

      return accumulator
    }, {})
  }, [room.roomType, roomTasks, visibleBeds, volunteers])

  const hasBedsToAssign = visibleBeds.some((bed) => bed.label.toLowerCase() === 'needs making')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextBeds = visibleBeds

    onSubmit({
      placeType: 'room',
      roomCode: room.code,
      roomSection: room.section,
      roomType,
      placeLabel: room.label,
      label: roomLabel,
      color: roomColor,
      beds: nextBeds,
      assignCleanerId: ['need cleaning', 'needs cleaning'].includes(roomLabel.trim().toLowerCase())
        ? assignCleanerId || undefined
        : undefined,
      assignVolunteerId: hasBedsToAssign ? assignVolunteerId || undefined : undefined,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={room.label}
      description={
        roomType === 'shared'
          ? 'Shared rooms track each bed separately. A bed marked as Needs making creates or reactivates a volunteer task.'
          : 'Private rooms keep the room status plus an optional bed-making request for volunteers.'
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <p className="text-sm font-medium text-ink">Room type</p>
          <div className="flex gap-2">
            <Button type="button" variant={roomType === 'private' ? 'primary' : 'secondary'} onClick={() => setRoomType('private')}>
              Private
            </Button>
            <Button type="button" variant={roomType === 'shared' ? 'primary' : 'secondary'} onClick={() => setRoomType('shared')}>
              Shared
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {roomPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setRoomLabel(preset.label)
                setRoomColor(preset.color)
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

        {['need cleaning', 'needs cleaning'].includes(roomLabel.trim().toLowerCase()) ? (
          <label className="grid gap-2 text-sm font-medium text-ink">
            Assign cleaning task to
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
          </label>
        ) : null}

        {hasBedsToAssign ? (
          <label className="grid gap-2 text-sm font-medium text-ink">
            Assign all bed-making tasks to
            <select
              value={assignVolunteerId}
              onChange={(event) => setAssignVolunteerId(event.target.value)}
              className="rounded-2xl border-slate-200"
            >
              <option value="">Leave unassigned</option>
              {volunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.id}>
                  {volunteer.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-slate-500">
              All beds marked as Needs making will be assigned separately to this volunteer. If left empty, they stay available for anyone to claim.
            </span>
          </label>
        ) : null}

        {roomType === 'private' ? (
          <>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">Bed service request</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use this when the bed should appear as a volunteer task.
                  </p>
                </div>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: visibleBeds[0]?.color ?? '#22c55e' }}
                >
                  {visibleBeds[0]?.label ?? 'Ready'}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {bedPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => updateBed(1, preset)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.color }} />
                      <span className="text-sm font-semibold text-ink">{preset.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Beds in this room
              <input
                type="number"
                min={2}
                max={14}
                value={bedCount}
                onChange={(event) => setBedCount(Number(event.target.value))}
                className="rounded-2xl border-slate-200"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              {visibleBeds.map((bed) => (
                <div key={bed.bedNumber} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">Bed {bed.bedNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">Choose how this bed should appear on the room board.</p>
                      {bedTaskAssignees[bed.bedNumber]?.current ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Assigned now: {bedTaskAssignees[bed.bedNumber]?.current}
                        </p>
                      ) : bedTaskAssignees[bed.bedNumber]?.last ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Last assigned: {bedTaskAssignees[bed.bedNumber]?.last}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: bed.color }}
                    >
                      {bed.label}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {bedPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateBed(bed.bedNumber, preset)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.color }} />
                          <span className="text-sm font-semibold text-ink">{preset.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save room setup</Button>
        </div>
      </form>
    </Modal>
  )
}
