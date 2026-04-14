import { useEffect, useMemo, useState } from 'react'
import { BedDouble, CheckSquare, SquareStack } from 'lucide-react'
import {
  BedStatus,
  BulkBedTaskSelection,
  CleaningPlaceStatus,
  CleaningRoom,
  User,
} from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

type GroupedRoom = {
  section: string
  rooms: Array<{
    room: CleaningRoom
    status?: CleaningPlaceStatus
  }>
}

const requestPresets = [
  { label: 'Ready', color: '#22c55e' },
  { label: 'Needs making', color: '#ef4444' },
  { label: 'Check', color: '#f59e0b' },
]

const defaultBed = (bedNumber: number): BedStatus => ({
  bedNumber,
  label: 'Ready',
  color: '#22c55e',
})

export const BulkBedTaskModal = ({
  open,
  onClose,
  groups,
  volunteers,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  groups: GroupedRoom[]
  volunteers: User[]
  onSubmit: (input: {
    selections: BulkBedTaskSelection[]
    assignVolunteerId?: string
    label: string
    color: string
  }) => void
}) => {
  const [mobileStep, setMobileStep] = useState<'select' | 'configure'>('select')
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('')
  const [requestLabel, setRequestLabel] = useState(requestPresets[0].label)
  const [requestColor, setRequestColor] = useState(requestPresets[0].color)
  const [selectedBedsByRoom, setSelectedBedsByRoom] = useState<Record<string, number[]>>({})

  useEffect(() => {
    if (!open) return
    setMobileStep('select')
    setSelectedVolunteerId('')
    setRequestLabel(requestPresets[0].label)
    setRequestColor(requestPresets[0].color)
    setSelectedBedsByRoom({})
  }, [open])

  const volunteerName = useMemo(
    () => volunteers.find((volunteer) => volunteer.id === selectedVolunteerId)?.name,
    [selectedVolunteerId, volunteers],
  )

  const selectionCount = useMemo(
    () => Object.values(selectedBedsByRoom).reduce((total, beds) => total + beds.length, 0),
    [selectedBedsByRoom],
  )

  const clearSelection = () => setSelectedBedsByRoom({})

  const toggleBed = (roomCode: string, bedNumber: number) => {
    setSelectedBedsByRoom((current) => {
      const currentBeds = current[roomCode] ?? []
      const nextBeds = currentBeds.includes(bedNumber)
        ? currentBeds.filter((value) => value !== bedNumber)
        : [...currentBeds, bedNumber].sort((left, right) => left - right)

      if (!nextBeds.length) {
        const { [roomCode]: _removed, ...rest } = current
        return rest
      }

      return {
        ...current,
        [roomCode]: nextBeds,
      }
    })
  }

  const toggleRoom = (roomCode: string, bedNumbers: number[]) => {
    setSelectedBedsByRoom((current) => {
      const currentBeds = current[roomCode] ?? []
      const everySelected = bedNumbers.every((bedNumber) => currentBeds.includes(bedNumber))

      if (everySelected) {
        const { [roomCode]: _removed, ...rest } = current
        return rest
      }

      return {
        ...current,
        [roomCode]: bedNumbers,
      }
    })
  }

  const handleSubmit = () => {
    const selections: BulkBedTaskSelection[] = groups
      .flatMap((group) => group.rooms)
      .map(({ room }) => ({
        roomCode: room.code,
        roomSection: room.section,
        roomType: room.roomType,
        placeLabel: room.label,
        bedNumbers: selectedBedsByRoom[room.code] ?? [],
      }))
      .filter((selection) => selection.bedNumbers.length > 0)

    if (!selections.length) return

    onSubmit({
      selections,
      assignVolunteerId: selectedVolunteerId || undefined,
      label: requestLabel,
      color: requestColor,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create bed tasks in bulk"
      description="Select rooms, choose the exact beds, and optionally assign all resulting tasks to one volunteer."
      panelClassName="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-6xl self-end rounded-t-[28px] rounded-b-none p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:h-auto sm:max-h-[90vh] sm:self-auto sm:rounded-[28px] sm:p-6"
      bodyClassName="mt-4 min-h-0 overflow-hidden"
    >
      <div className="grid h-full min-h-0 gap-4 grid-rows-[minmax(0,1fr)_auto] sm:gap-5 lg:h-[74vh] lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1">
        <div className={`min-h-0 overflow-y-auto pr-1 ${mobileStep === 'configure' ? 'hidden lg:block' : 'order-1 lg:order-1'}`}>
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.section} className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-display text-lg font-semibold text-ink">{group.section}</h4>
                  <span className="text-sm text-slate-500">{group.rooms.length} rooms</span>
                </div>

                <div className="grid gap-3">
                  {group.rooms.map(({ room, status }) => {
                    const roomBeds =
                      room.roomType === 'private'
                        ? [1]
                        : Array.from({ length: room.bedCount }, (_, index) => index + 1)
                    const selectedBeds = selectedBedsByRoom[room.code] ?? []
                    const selectedAll = roomBeds.every((bedNumber) => selectedBeds.includes(bedNumber))
                    const visibleBeds = roomBeds.map((bedNumber) =>
                      status?.beds.find((bed) => bed.bedNumber === bedNumber) ?? defaultBed(bedNumber),
                    )

                    return (
                      <div key={room.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-lg font-semibold text-ink">{room.code}</p>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {room.roomType === 'private' ? 'Private' : `${room.bedCount} beds`}
                              </span>
                              {selectedBeds.length ? (
                                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                                  {volunteerName ? volunteerName : 'Unassigned on confirm'}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{room.label}</p>
                          </div>

                          <Button
                            size="sm"
                            variant={selectedAll ? 'primary' : 'secondary'}
                            onClick={() => toggleRoom(room.code, roomBeds)}
                          >
                            <CheckSquare size={15} className="mr-2" />
                            {selectedAll ? 'Clear room' : 'Select room'}
                          </Button>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {visibleBeds.map((bed) => {
                            const selected = selectedBeds.includes(bed.bedNumber)
                            return (
                              <button
                                key={`${room.code}-${bed.bedNumber}`}
                                type="button"
                                onClick={() => toggleBed(room.code, bed.bedNumber)}
                                className={`rounded-2xl border px-4 py-3 text-left transition ${
                                  selected ? 'border-teal bg-teal/5 shadow-soft' : 'border-slate-200 bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <BedDouble size={15} className="text-slate-500" />
                                    <span className="text-sm font-semibold text-ink">Bed {bed.bedNumber}</span>
                                  </div>
                                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: bed.color }} />
                                </div>
                                <p className="mt-2 text-xs font-medium text-slate-500">{bed.label}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex min-h-0 flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:order-2 lg:h-full lg:gap-4 lg:overflow-y-auto">
          <div className="hidden items-start justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 sm:flex">
            <p className="text-sm text-slate-500">
              Select rooms, choose the exact beds, and optionally assign all resulting tasks to one volunteer.
            </p>
            <Button type="button" size="sm" variant="ghost" onClick={clearSelection} className="hidden shrink-0 sm:inline-flex">
              Clear selection
            </Button>
          </div>

          <div className={`${mobileStep === 'select' ? 'hidden lg:block' : 'block'} rounded-[24px] border border-slate-200 bg-white p-4`}>
            <p className="text-sm font-medium text-ink">Task type</p>
            <div className="mt-3 grid gap-2 sm:hidden">
              <select
                value={requestLabel}
                onChange={(event) => {
                  const selectedPreset = requestPresets.find((preset) => preset.label === event.target.value)
                  if (!selectedPreset) return
                  setRequestLabel(selectedPreset.label)
                  setRequestColor(selectedPreset.color)
                }}
                className="rounded-2xl border-slate-200"
              >
                {requestPresets.map((preset) => (
                  <option key={preset.label} value={preset.label}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-ink">
                <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: requestColor }} />
                {requestLabel}
              </div>
            </div>
            <div className="mt-3 hidden gap-2 sm:grid">
              {requestPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setRequestLabel(preset.label)
                    setRequestColor(preset.color)
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    requestLabel === preset.label
                      ? 'border-teal bg-teal/8 shadow-soft'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.color }} />
                    <span className="text-sm font-semibold text-ink">{preset.label}</span>
                  </div>
                  {requestLabel === preset.label ? (
                    <p className="mt-2 text-xs font-semibold text-teal">Selected</p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <label className={`${mobileStep === 'select' ? 'hidden lg:grid' : 'grid'} gap-2 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-medium text-ink`}>
            Assign selected beds to
            <select
              value={selectedVolunteerId}
              onChange={(event) => setSelectedVolunteerId(event.target.value)}
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
              If left empty, every bed task will remain open for volunteers to claim.
            </span>
          </label>

          <div className={`${mobileStep === 'select' ? 'hidden lg:block' : 'block'} rounded-[24px] border border-slate-200 bg-white p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{selectionCount} beds selected</p>
                <p className="mt-1 text-sm text-slate-500">
                  Each selected bed becomes its own volunteer task when you confirm.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-ink">
                <SquareStack size={16} className="text-teal" />
                {volunteerName ? `Will assign to ${volunteerName}` : 'Will stay open'}
              </div>
            </div>
          </div>

          <div className="hidden gap-3 border-t border-slate-200 bg-slate-50 pt-3 lg:grid lg:sticky lg:bottom-0 lg:mt-auto">
            <div className="hidden gap-3 lg:grid">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" disabled={selectionCount === 0} onClick={handleSubmit}>
                Create bed tasks
              </Button>
            </div>
          </div>
        </div>

        <div className="order-2 grid gap-3 border-t border-slate-200 bg-white pt-3 lg:hidden">
          {mobileStep === 'select' ? (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={onClose} className="w-full">
                Cancel
              </Button>
              <Button type="button" disabled={selectionCount === 0} onClick={() => setMobileStep('configure')} className="w-full">
                Next
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={() => setMobileStep('select')} className="w-full">
                Back
              </Button>
              <Button type="button" disabled={selectionCount === 0} onClick={handleSubmit} className="w-full">
                Confirm
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
