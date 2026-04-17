import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
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
  { label: 'Check', color: '#f59e0b' },
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
    roomTaskType?: string
  }>
  onSubmit: (
    input: CleaningPlaceStatusDraftInput,
    roomConfig: {
      roomType: RoomType
      bedCount: number
      bedTaskPoints: number
      checkTaskPoints: number
      trashTaskPoints: number
    },
  ) => void | Promise<void>
}) => {
  const initialBedCount = room.roomType === 'private' ? 1 : Math.max(2, room.bedCount, currentStatus?.beds.length ?? 0)
  const [roomType, setRoomType] = useState<RoomType>(currentStatus?.roomType ?? room.roomType)
  const [roomLabel, setRoomLabel] = useState(currentStatus?.roomServiceLabel ?? currentStatus?.label ?? 'Clean')
  const [roomColor, setRoomColor] = useState(currentStatus?.roomServiceColor ?? currentStatus?.color ?? '#22c55e')
  const [assignCleanerId, setAssignCleanerId] = useState('')
  const [assignVolunteerId, setAssignVolunteerId] = useState('')
  const [bedCount, setBedCount] = useState(initialBedCount)
  const [bedTaskPoints, setBedTaskPoints] = useState(room.bedTaskPoints ?? 10)
  const [checkTaskPoints, setCheckTaskPoints] = useState(room.checkTaskPoints ?? 10)
  const [trashTaskPoints, setTrashTaskPoints] = useState(room.trashTaskPoints ?? 10)
  const [trashRequested, setTrashRequested] = useState(false)
  const [beds, setBeds] = useState<BedStatus[]>(currentStatus?.beds.length ? currentStatus.beds : [defaultBed(1)])
  const [showStructureSettings, setShowStructureSettings] = useState(false)
  const [editingBedNumber, setEditingBedNumber] = useState<number | null>(null)
  const [mobileVolunteerPromptOpen, setMobileVolunteerPromptOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    setRoomType(currentStatus?.roomType ?? room.roomType)
    setRoomLabel(currentStatus?.roomServiceLabel ?? currentStatus?.label ?? 'Clean')
    setRoomColor(currentStatus?.roomServiceColor ?? currentStatus?.color ?? '#22c55e')
    setAssignCleanerId('')
    setAssignVolunteerId('')
    setBedCount(room.roomType === 'private' ? 1 : Math.max(2, room.bedCount, currentStatus?.beds.length ?? 0))
    setBedTaskPoints(room.bedTaskPoints ?? 10)
    setCheckTaskPoints(room.checkTaskPoints ?? 10)
    setTrashTaskPoints(room.trashTaskPoints ?? 10)
    setTrashRequested(false)
    setBeds(currentStatus?.beds.length ? currentStatus.beds : [defaultBed(1)])
    setShowStructureSettings(false)
    setEditingBedNumber(null)
    setMobileVolunteerPromptOpen(false)
  }, [open, room.id, currentStatus?.id])

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

  const hasBedsToAssign = visibleBeds.some((bed) => {
    const normalized = bed.label.toLowerCase()
    return normalized === 'needs making' || normalized === 'check'
  }) || trashRequested

  useEffect(() => {
    if (editingBedNumber !== null && !visibleBeds.some((bed) => bed.bedNumber === editingBedNumber)) {
      setEditingBedNumber(null)
    }
  }, [editingBedNumber, visibleBeds])

  const submitRoomSetup = async () => {
    const nextBeds = visibleBeds
    onClose()

    await Promise.resolve(
      onSubmit(
        {
          placeType: 'room',
          roomCode: room.code,
          roomSection: room.section,
          roomType,
          placeLabel: room.label,
          label: roomLabel,
          color: roomColor,
          beds: nextBeds,
          trashRequested,
          assignCleanerId: ['need cleaning', 'needs cleaning'].includes(roomLabel.trim().toLowerCase())
            ? assignCleanerId || undefined
            : undefined,
          assignVolunteerId: hasBedsToAssign ? assignVolunteerId || undefined : undefined,
          applyVolunteerAssignment: hasBedsToAssign,
        },
        {
          roomType,
          bedCount: roomType === 'private' ? 1 : bedCount,
          bedTaskPoints,
          checkTaskPoints,
          trashTaskPoints,
        },
      ),
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitRoomSetup()
  }

  const handleMobileSave = () => {
    if (hasBedsToAssign && !mobileVolunteerPromptOpen) {
      setMobileVolunteerPromptOpen(true)
      return
    }

    void submitRoomSetup()
  }

  const editingBed = editingBedNumber !== null
    ? visibleBeds.find((bed) => bed.bedNumber === editingBedNumber) ?? null
    : null

  const renderBedTile = (bed: BedStatus) => {
    const assignee = bedTaskAssignees[bed.bedNumber]

    return (
      <button
        key={bed.bedNumber}
        type="button"
        onClick={() => setEditingBedNumber(bed.bedNumber)}
        className="min-w-0 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:shadow-soft"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">Bed {bed.bedNumber}</p>
            <p className="mt-1 break-words text-xs font-medium text-slate-500">
              {assignee?.current
                ? `Assigned now: ${assignee.current}`
                : assignee?.last
                  ? `Last assigned: ${assignee.last}`
                  : 'Tap to change status'}
            </p>
          </div>
          <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: bed.color }} />
        </div>
        <div className="mt-4 flex min-w-0 items-center justify-between gap-3">
          <span
            className="inline-flex min-w-0 max-w-full rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: bed.color }}
          >
            <span className="truncate">{bed.label}</span>
          </span>
        </div>
      </button>
    )
  }

  return (
    <>
      <Modal
      open={open}
      onClose={onClose}
      title={`Room ${room.code}`}
      panelClassName="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-4xl self-end rounded-t-[28px] rounded-b-none p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:h-auto sm:max-h-[90vh] sm:self-auto sm:rounded-[28px] sm:p-6"
      bodyClassName="mt-4 overflow-hidden"
      description={
        roomType === 'shared'
          ? 'Shared rooms track each bed separately. Needs making, Check, and trash requests create or reactivate volunteer tasks.'
          : 'Private rooms keep the room status plus optional volunteer tasks for bed work and trash pickup.'
      }
    >
      <form onSubmit={handleSubmit} className="grid h-full min-h-0 gap-4 grid-rows-[minmax(0,1fr)_auto] sm:gap-5 lg:h-[74vh] lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1">
        <div className="order-1 min-h-0 overflow-y-auto pr-1 lg:order-1">
          <div className="grid gap-5 lg:hidden">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-semibold text-ink">{`Room ${room.code}`}</p>
                  <p className="mt-1 text-sm text-slate-500">{room.section}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStructureSettings((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
                >
                  <Settings2 size={18} />
                </button>
              </div>

              {showStructureSettings ? (
                <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4">
                  <div className="flex gap-2">
                    <Button type="button" variant={roomType === 'private' ? 'primary' : 'secondary'} onClick={() => setRoomType('private')}>
                      Private
                    </Button>
                    <Button type="button" variant={roomType === 'shared' ? 'primary' : 'secondary'} onClick={() => setRoomType('shared')}>
                      Shared
                    </Button>
                  </div>

                  {roomType === 'shared' ? (
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
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="grid gap-2 text-sm font-medium text-ink">
                      Bed points
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={bedTaskPoints}
                        onChange={(event) => setBedTaskPoints(Number(event.target.value))}
                        className="rounded-2xl border-slate-200"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-ink">
                      Check points
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={checkTaskPoints}
                        onChange={(event) => setCheckTaskPoints(Number(event.target.value))}
                        className="rounded-2xl border-slate-200"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-ink">
                      Trash points
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={trashTaskPoints}
                        onChange={(event) => setTrashTaskPoints(Number(event.target.value))}
                        className="rounded-2xl border-slate-200"
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">Room status</p>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white shadow-soft"
                  style={{ backgroundColor: roomColor }}
                >
                  {roomLabel}
                </span>
              </div>
              <select
                value={roomLabel}
                onChange={(event) => {
                  const next = roomPresets.find((preset) => preset.label === event.target.value)
                  if (!next) return
                  setRoomLabel(next.label)
                  setRoomColor(next.color)
                }}
                className="mt-3 w-full min-w-0 rounded-2xl border-slate-200"
              >
                {roomPresets.map((preset) => (
                  <option key={preset.label} value={preset.label}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {['need cleaning', 'needs cleaning'].includes(roomLabel.trim().toLowerCase()) ? (
              <label className="grid gap-2 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-medium text-ink">
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

            <label className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white p-4 text-sm text-ink">
              <input
                type="checkbox"
                checked={trashRequested}
                onChange={(event) => setTrashRequested(event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">Take out trash</span>
                <span className="mt-1 block text-xs text-slate-500">
                  Creates a volunteer task for this room worth {trashTaskPoints} points.
                </span>
              </span>
            </label>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleBeds.map(renderBedTile)}
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="grid gap-5">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-ink">Beds in this room</p>
                <p className="mt-1 text-sm text-slate-500">
                  Use the grid to scan bed states quickly. Click any bed to open its status options.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleBeds.map(renderBedTile)}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:order-2 lg:flex lg:h-full lg:min-h-0 lg:gap-4 lg:overflow-y-auto">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink lg:block hidden">Room setup</p>
                <p className="text-sm font-medium text-ink lg:hidden">Room {room.code}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {roomType === 'private' ? 'Private room' : `${bedCount} beds in shared room`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStructureSettings((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
              >
                <Settings2 size={18} />
              </button>
            </div>

            {showStructureSettings ? (
              <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4">
                <div className="flex gap-2">
                  <Button type="button" variant={roomType === 'private' ? 'primary' : 'secondary'} onClick={() => setRoomType('private')}>
                    Private
                  </Button>
                  <Button type="button" variant={roomType === 'shared' ? 'primary' : 'secondary'} onClick={() => setRoomType('shared')}>
                    Shared
                  </Button>
                </div>

                {roomType === 'shared' ? (
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
                ) : null}

                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Bed points
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={bedTaskPoints}
                      onChange={(event) => setBedTaskPoints(Number(event.target.value))}
                      className="rounded-2xl border-slate-200"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Check points
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={checkTaskPoints}
                      onChange={(event) => setCheckTaskPoints(Number(event.target.value))}
                      className="rounded-2xl border-slate-200"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Trash points
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={trashTaskPoints}
                      onChange={(event) => setTrashTaskPoints(Number(event.target.value))}
                      className="rounded-2xl border-slate-200"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">Room status</p>
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white shadow-soft"
                style={{ backgroundColor: roomColor }}
              >
                {roomLabel}
              </span>
            </div>
            <div className="mt-3 grid gap-2 lg:hidden">
              <select
                value={roomLabel}
                onChange={(event) => {
                  const next = roomPresets.find((preset) => preset.label === event.target.value)
                  if (!next) return
                  setRoomLabel(next.label)
                  setRoomColor(next.color)
                }}
                className="rounded-2xl border-slate-200"
              >
                {roomPresets.map((preset) => (
                  <option key={preset.label} value={preset.label}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 hidden gap-2 lg:grid">
              {roomPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setRoomLabel(preset.label)
                    setRoomColor(preset.color)
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    roomLabel === preset.label
                      ? 'border-teal bg-teal/8 shadow-soft'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.color }} />
                    <span className="text-sm font-semibold text-ink">{preset.label}</span>
                  </div>
                  {roomLabel === preset.label ? (
                    <p className="mt-2 text-xs font-semibold text-teal">Selected</p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {['need cleaning', 'needs cleaning'].includes(roomLabel.trim().toLowerCase()) ? (
            <label className="grid gap-2 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-medium text-ink">
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

          <label className="grid gap-2 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-medium text-ink">
            <span>Volunteer extras</span>
            <span className="flex items-start gap-3 text-sm font-normal text-ink">
              <input
                type="checkbox"
                checked={trashRequested}
                onChange={(event) => setTrashRequested(event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">Take out trash</span>
                <span className="mt-1 block text-xs text-slate-500">
                  Creates a volunteer task for this room worth {trashTaskPoints} points.
                </span>
              </span>
            </span>
          </label>

          {hasBedsToAssign ? (
            <label className="grid gap-2 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-medium text-ink">
              Assign room tasks to
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
                Beds marked as Needs making or Check, plus trash if requested, will be assigned separately to this volunteer. If left empty, they stay available for anyone to claim.
              </span>
            </label>
          ) : null}

          <div className="mt-1 flex gap-3 border-t border-slate-200 bg-slate-50 pt-3 lg:sticky lg:bottom-0 lg:mt-auto">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save room setup
            </Button>
          </div>
        </div>

        <div className="order-2 grid gap-3 border-t border-slate-200 bg-white pt-3 lg:hidden">
          {mobileVolunteerPromptOpen && hasBedsToAssign ? (
            <label className="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-ink">
              Assign room tasks to
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
                Room tasks from Needs making, Check, and trash requests will be assigned separately. If left empty, they stay available for anyone to claim.
              </span>
            </label>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button type="button" onClick={handleMobileSave} className="w-full">
              Save setup
            </Button>
          </div>
        </div>
      </form>
      </Modal>
      <Modal
        open={Boolean(editingBed)}
        onClose={() => setEditingBedNumber(null)}
        title={editingBed ? `Bed ${editingBed.bedNumber}` : 'Bed status'}
        description="Choose how this bed should appear on the room board and in volunteer tasks."
        panelClassName="max-w-md"
      >
        {editingBed ? (
          <div className="grid gap-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">Current status</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick the next state for this bed.
                  </p>
                </div>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: editingBed.color }}
                >
                  {editingBed.label}
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              {bedPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    updateBed(editingBed.bedNumber, preset)
                    setEditingBedNumber(null)
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    editingBed.label === preset.label
                      ? 'border-teal bg-teal/8 shadow-soft'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: preset.color }} />
                    <span className="min-w-0 truncate text-sm font-semibold text-ink">{preset.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setEditingBedNumber(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
