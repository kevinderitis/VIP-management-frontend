import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BedDouble, DoorOpen, Filter, Search, UserRound } from 'lucide-react'
import {
  ActiveStay,
  CheckinGuest,
  CheckinRecord,
  CleaningPlaceStatus,
  CleaningRoom,
} from '../../types/models'
import { countryOptions } from '../../data/country-options'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

const ddMmToIso = (value?: string) => {
  if (!value) return ''
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

const isoToDdMm = (value?: string) => {
  if (!value) return ''
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ''
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

const birthDateToInput = (guest?: CheckinGuest | null) => {
  const source = guest?.birthDate || guest?.birthDateDDMMYYYY || ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return source
  return ddMmToIso(source)
}

const guestName = (occupancy: ActiveStay) => occupancy.guestName || occupancy.passportNo
const normalizeStatusLabel = (value?: string) => value?.trim().toLowerCase() ?? ''
const PRIVATE_ROOM_CAPACITY = 2
const todayThailandIso = () => {
  const now = new Date()
  const year = new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: 'Asia/Bangkok' }).format(now)
  const month = new Intl.DateTimeFormat('en-CA', { month: '2-digit', timeZone: 'Asia/Bangkok' }).format(now)
  const day = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: 'Asia/Bangkok' }).format(now)
  return `${year}-${month}-${day}`
}

type DraftState = {
  firstName: string
  middleName: string
  lastName: string
  gender: '' | 'M' | 'F'
  passportNo: string
  nationality: string
  birthDate: string
  phoneNo: string
  status: CheckinRecord['status']
  checkInDate: string
  checkOutDate: string
  roomCode: string
  bedNumber: string
}

export const CheckinStayEditorModal = ({
  open,
  mode,
  record,
  selectedDate,
  rooms,
  activeStays,
  placeStatuses,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  mode: 'scan-review' | 'manual' | 'edit'
  record?: Partial<CheckinRecord> | null
  selectedDate: string
  rooms: CleaningRoom[]
  activeStays: ActiveStay[]
  placeStatuses: CleaningPlaceStatus[]
  saving?: boolean
  onClose: () => void
  onSave: (input: {
    guest: CheckinGuest
    phoneNo?: string
    status: CheckinRecord['status']
    checkInDate: string
    checkOutDate: string
    roomCode: string
    bedNumber?: number
  }) => Promise<void> | void
}) => {
  const [draft, setDraft] = useState<DraftState>({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    passportNo: '',
    nationality: '',
    birthDate: '',
    phoneNo: '',
    status: 'confirmed',
    checkInDate: selectedDate,
    checkOutDate: '',
    roomCode: '',
    bedNumber: '',
  })
  const [error, setError] = useState('')
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1)
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'private' | 'shared'>('all')
  const [roomSearch, setRoomSearch] = useState('')
  const [showUnavailableRooms, setShowUnavailableRooms] = useState(false)
  const [showUnavailableBeds, setShowUnavailableBeds] = useState(false)

  useEffect(() => {
    if (!open) return

    setDraft({
      firstName: record?.guest?.firstName ?? '',
      middleName: record?.guest?.middleName ?? '',
      lastName: record?.guest?.lastName ?? '',
      gender: record?.guest?.gender ?? '',
      passportNo: record?.guest?.passportNo ?? '',
      nationality: record?.guest?.nationality ?? '',
      birthDate: birthDateToInput(record?.guest),
      phoneNo: record?.phoneNo ?? '',
      status: record?.status ?? (mode === 'scan-review' ? 'draft' : 'confirmed'),
      checkInDate: record?.checkInDate ?? selectedDate,
      checkOutDate: ddMmToIso(record?.checkOutDate) || '',
      roomCode: record?.roomCode ?? '',
      bedNumber: record?.bedNumber ? String(record.bedNumber) : '',
    })
    setError('')
    setMobileStep(1)
    setRoomTypeFilter('all')
    setRoomSearch('')
    setShowUnavailableRooms(false)
    setShowUnavailableBeds(false)
  }, [mode, open, record, selectedDate])

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.code === draft.roomCode),
    [draft.roomCode, rooms],
  )

  const occupantMap = useMemo(() => {
    const byRoom = new Map<string, ActiveStay[]>()
    for (const stay of activeStays) {
      if (!stay.roomCode) continue
      byRoom.set(stay.roomCode, [...(byRoom.get(stay.roomCode) ?? []), stay])
    }
    return byRoom
  }, [activeStays])

  const roomStatusMap = useMemo(
    () =>
      new Map(
        placeStatuses
          .filter((status) => status.placeType === 'room' && status.roomCode)
          .map((status) => [status.roomCode as string, status]),
      ),
    [placeStatuses],
  )

  const roomCards = useMemo(
    () =>
      rooms
        .filter((room) => room.isActive)
        .filter((room) => roomTypeFilter === 'all' || room.roomType === roomTypeFilter)
        .filter((room) => {
          const query = roomSearch.trim().toLowerCase()
          if (!query) return true
          return [room.code, room.label, room.section].some((value) =>
            value.toLowerCase().includes(query),
          )
        })
        .sort(
          (left, right) =>
            left.section.localeCompare(right.section) || left.code.localeCompare(right.code),
        )
        .map((room) => {
          const occupants = occupantMap.get(room.code) ?? []
          const status = roomStatusMap.get(room.code)
          const roomNeedsCleaning =
            normalizeStatusLabel(status?.roomServiceLabel || status?.label) === 'needs cleaning' ||
            normalizeStatusLabel(status?.roomServiceLabel || status?.label) === 'need cleaning'

          const occupiedBeds = room.roomType === 'shared'
            ? Array.from({ length: room.bedCount }, (_, index) => {
                const bedNumber = index + 1
                const occupant = occupants.find((stay) => stay.bedNumber === bedNumber)
                const bedStatus = status?.beds.find((bed) => bed.bedNumber === bedNumber)
                const label = normalizeStatusLabel(bedStatus?.label)
                return Boolean(
                  occupant || label === 'occupied' || label === 'needs cleaning' || label === 'need cleaning',
                )
              }).filter(Boolean).length
            : roomNeedsCleaning ? PRIVATE_ROOM_CAPACITY : Math.min(PRIVATE_ROOM_CAPACITY, occupants.length)

          const availableBeds = room.roomType === 'shared'
            ? Math.max(0, room.bedCount - occupiedBeds)
            : Math.max(0, PRIVATE_ROOM_CAPACITY - occupiedBeds)
          const isFull = room.roomType === 'shared' ? availableBeds === 0 : availableBeds === 0

          return {
            room,
            availableBeds,
            isFull,
            roomNeedsCleaning,
          }
        })
        .filter((entry) => showUnavailableRooms || !entry.isFull),
    [occupantMap, placeStatuses, roomSearch, roomStatusMap, roomTypeFilter, rooms, showUnavailableRooms],
  )

  const roomOccupants = selectedRoom ? occupantMap.get(selectedRoom.code) ?? [] : []

  const bedCards = useMemo(() => {
    if (!selectedRoom) return []
    if (selectedRoom.roomType === 'private') return []

    const status = roomStatusMap.get(selectedRoom.code)

    return Array.from({ length: selectedRoom.bedCount }, (_, index) => {
      const bedNumber = index + 1
      const occupant = roomOccupants.find((stay) => stay.bedNumber === bedNumber)
      const bedStatus = status?.beds.find((bed) => bed.bedNumber === bedNumber)
      const statusLabel = normalizeStatusLabel(bedStatus?.label)
      const blocked = Boolean(
        occupant || statusLabel === 'occupied' || statusLabel === 'needs cleaning' || statusLabel === 'need cleaning',
      )

      return {
        bedNumber,
        blocked,
        color: bedStatus?.color ?? (blocked ? '#64748b' : '#22c55e'),
        label: occupant
          ? guestName(occupant)
          : statusLabel === 'needs cleaning' || statusLabel === 'need cleaning'
            ? 'Needs cleaning'
            : 'Available',
      }
    }).filter((bed) => showUnavailableBeds || !bed.blocked)
  }, [roomOccupants, roomStatusMap, selectedRoom, showUnavailableBeds])

  const setField = <K extends keyof DraftState>(field: K, value: DraftState[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const validateGuestDetails = () => {
    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.passportNo.trim()) {
      setError('First name, last name, and passport number are required.')
      return false
    }
    if (!draft.gender) {
      setError('Gender is required.')
      return false
    }
    if (!draft.nationality.trim() || draft.nationality.trim().length !== 3) {
      setError('Nationality is required.')
      return false
    }
    if (!countryOptions.some((entry) => entry.code === draft.nationality.trim().toUpperCase())) {
      setError('Please select a valid nationality.')
      return false
    }
    if (!draft.checkOutDate) {
      setError('Check-out date is required.')
      return false
    }
    if (draft.checkOutDate <= todayThailandIso()) {
      setError('Check-out date must be after today.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async () => {
    if (!validateGuestDetails()) {
      return
    }
    if (!draft.roomCode) {
      setError('Please choose a room.')
      return
    }
    if (selectedRoom?.roomType === 'shared' && !draft.bedNumber) {
      setError('Please choose a bed for the shared room.')
      return
    }

    setError('')
    await onSave({
      guest: {
        passportNo: draft.passportNo.trim().toUpperCase(),
        firstName: draft.firstName.trim(),
        middleName: draft.middleName.trim(),
        lastName: draft.lastName.trim(),
        gender: draft.gender || 'M',
        nationality: draft.nationality.trim().toUpperCase(),
        birthDate: draft.birthDate,
      },
      phoneNo: draft.phoneNo.trim() || undefined,
      status: draft.status,
      checkInDate: draft.checkInDate,
      checkOutDate: isoToDdMm(draft.checkOutDate),
      roomCode: draft.roomCode,
      bedNumber:
        selectedRoom?.roomType === 'shared' && draft.bedNumber
          ? Number(draft.bedNumber)
          : undefined,
    })
  }

  const handleMobileNextFromDetails = () => {
    if (!validateGuestDetails()) return
    setMobileStep(2)
  }

  const handleMobileNextFromRoom = () => {
    if (!draft.roomCode) {
      setError('Please choose a room.')
      return
    }
    if (selectedRoom?.roomType === 'shared') {
      setError('')
      setMobileStep(3)
      return
    }
    void handleSubmit()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        mode === 'edit'
          ? 'Edit passport record'
          : mode === 'manual'
            ? 'Manual check-in'
            : 'Review scanned passport'
      }
      description="Confirm the guest details, choose the room, and place them in the correct bed when the room is shared."
      panelClassName="h-[calc(100dvh-2rem)] max-w-6xl overflow-x-hidden sm:h-[min(90vh,920px)]"
      bodyClassName="!overflow-hidden"
    >
      <div className="hidden h-full min-h-0 flex-col gap-4 overflow-hidden lg:flex">
        <div className="grid grid-cols-3 gap-2">
          {[
            { step: 1 as const, label: 'Details' },
            { step: 2 as const, label: 'Room' },
            { step: 3 as const, label: 'Bed' },
          ].map((item) => {
            const active = item.step === mobileStep
            const enabled = item.step < 3 || selectedRoom?.roomType === 'shared'
            return (
              <button
                key={item.step}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && setMobileStep(item.step)}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold uppercase tracking-[0.16em] ${
                  active ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500'
                } ${!enabled ? 'opacity-40' : ''}`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2">
          {mobileStep === 1 ? (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&_input]:min-w-0 [&_input]:w-full [&_select]:min-w-0 [&_select]:w-full">
              <label className="grid gap-2 text-sm font-medium text-ink">
                First name
                <input value={draft.firstName} onChange={(event) => setField('firstName', event.target.value)} className="rounded-2xl border-slate-200" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Middle name
                <input value={draft.middleName} onChange={(event) => setField('middleName', event.target.value)} className="rounded-2xl border-slate-200" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Last name
                <input value={draft.lastName} onChange={(event) => setField('lastName', event.target.value)} className="rounded-2xl border-slate-200" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Gender
                <select
                  value={draft.gender}
                  onChange={(event) => setField('gender', event.target.value as 'M' | 'F')}
                  className="rounded-2xl border-slate-200"
                >
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Passport number
                <input value={draft.passportNo} onChange={(event) => setField('passportNo', event.target.value.toUpperCase())} className="rounded-2xl border-slate-200" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Nationality
                <select
                  value={draft.nationality}
                  onChange={(event) => setField('nationality', event.target.value.toUpperCase())}
                  className="rounded-2xl border-slate-200"
                >
                  <option value="">Select</option>
                  {countryOptions.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Birth date
                <input type="date" value={draft.birthDate} onChange={(event) => setField('birthDate', event.target.value)} className="rounded-2xl border-slate-200" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Phone
                <input value={draft.phoneNo} onChange={(event) => setField('phoneNo', event.target.value)} className="rounded-2xl border-slate-200" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Check-out date
                <input type="date" min={todayThailandIso()} value={draft.checkOutDate} onChange={(event) => setField('checkOutDate', event.target.value)} className="rounded-2xl border-slate-200" />
              </label>
              <div className="grid gap-2 text-sm font-medium text-ink">
                Check-in date
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {draft.checkInDate}
                </div>
              </div>
              <label className="grid gap-2 text-sm font-medium text-ink sm:col-span-2">
                TM30 status
                <select value={draft.status} onChange={(event) => setField('status', event.target.value as CheckinRecord['status'])} className="rounded-2xl border-slate-200">
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="exported">Exported</option>
                </select>
              </label>
            </div>
          ) : null}

          {mobileStep === 2 ? (
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <DoorOpen size={16} className="text-teal" />
                  Choose room
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_220px]">
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    <span className="flex items-center gap-2">
                      <Search size={14} className="text-slate-400" />
                      Find room
                    </span>
                    <input
                      value={roomSearch}
                      onChange={(event) => setRoomSearch(event.target.value)}
                      placeholder="Search by room code or name"
                      className="rounded-2xl border-slate-200"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    <span className="flex items-center gap-2">
                      <Filter size={14} className="text-slate-400" />
                      Room type
                    </span>
                    <select value={roomTypeFilter} onChange={(event) => setRoomTypeFilter(event.target.value as 'all' | 'private' | 'shared')} className="rounded-2xl border-slate-200">
                      <option value="all">All rooms</option>
                      <option value="private">Private only</option>
                      <option value="shared">Shared only</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <Button type="button" variant={showUnavailableRooms ? 'primary' : 'secondary'} onClick={() => setShowUnavailableRooms((current) => !current)} className="w-full">
                      {showUnavailableRooms ? 'Showing full rooms' : 'Hide full rooms'}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 h-[420px] overflow-y-auto pr-1">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {roomCards.map(({ room, availableBeds, isFull, roomNeedsCleaning }) => (
                    <button
                      key={room.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        setField('roomCode', room.code)
                        setField('bedNumber', '')
                      }}
                      className={`rounded-[24px] p-4 text-left text-white shadow-soft transition ${
                        draft.roomCode === room.code ? 'ring-2 ring-teal ring-offset-2 ring-offset-white' : ''
                      } ${isFull ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5'}`}
                      style={{ backgroundColor: roomNeedsCleaning ? '#f97316' : isFull ? '#64748b' : '#22c55e' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl font-semibold">{room.code}</p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/85">{room.section}</p>
                        </div>
                        {room.roomType === 'shared' ? <BedDouble size={16} className="text-white/90" /> : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          {room.roomType}
                        </span>
                        {room.roomType === 'shared' ? (
                          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            {availableBeds} available beds
                          </span>
                        ) : null}
                        {roomNeedsCleaning ? (
                          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            Needs cleaning
                          </span>
                        ) : null}
                        {isFull ? (
                          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            Full
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {mobileStep === 3 ? (
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <BedDouble size={16} className="text-teal" />
                  Bed assignment
                </div>
                {selectedRoom ? (
                  <>
                    <p className="mt-2 text-sm text-slate-500">
                      Choose one available bed. Occupied or cleaning-blocked beds stay unavailable for selection.
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">Beds</p>
                      <Button type="button" size="sm" variant={showUnavailableBeds ? 'primary' : 'secondary'} onClick={() => setShowUnavailableBeds((current) => !current)}>
                        {showUnavailableBeds ? 'Showing blocked beds' : 'Hide blocked beds'}
                      </Button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {bedCards.map((bed) => (
                        <button
                          key={bed.bedNumber}
                          type="button"
                          disabled={bed.blocked}
                          onClick={() => setField('bedNumber', String(bed.bedNumber))}
                          className={`rounded-[20px] p-4 text-left text-white shadow-soft transition ${
                            draft.bedNumber === String(bed.bedNumber) ? 'ring-2 ring-teal ring-offset-2 ring-offset-white' : ''
                          } ${bed.blocked ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5'}`}
                          style={{ backgroundColor: bed.color }}
                        >
                          <p className="font-display text-lg font-semibold">{selectedRoom.code}-{bed.bedNumber}</p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-white/85">{bed.label}</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Pick a room first.</p>
                )}
              </div>

              {roomOccupants.length ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <UserRound size={16} />
                    Current occupants
                  </div>
                  <div className="mt-3 grid gap-2">
                    {roomOccupants.map((occupant) => (
                      <div key={occupant.id} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                        <span className="font-semibold text-ink">
                          Bed {occupant.bedNumber}
                        </span>
                        <span className="ml-2">{guestName(occupant)}</span>
                        <span className="ml-2 text-slate-400">
                          ({occupant.checkInDate} to {occupant.checkOutDate})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 bg-white pt-4">
          <div className="flex justify-end gap-3">
            {mobileStep > 1 ? (
              <Button type="button" variant="secondary" onClick={() => setMobileStep((current) => (current === 3 ? 2 : 1))}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            )}
            {mobileStep === 1 ? (
              <Button type="button" onClick={handleMobileNextFromDetails}>
                Next
              </Button>
            ) : mobileStep === 2 ? (
              <Button type="button" onClick={handleMobileNextFromRoom} disabled={saving}>
                {selectedRoom?.roomType === 'shared' ? 'Next' : saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Confirm check-in'}
              </Button>
            ) : (
              <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
                {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Confirm check-in'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden lg:hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { step: 1 as const, label: 'Details' },
                { step: 2 as const, label: 'Room' },
                { step: 3 as const, label: 'Bed' },
              ].map((item) => {
                const active = item.step === mobileStep
                const enabled = item.step < 3 || selectedRoom?.roomType === 'shared'
                return (
                  <button
                    key={item.step}
                    type="button"
                    disabled={!enabled}
                    onClick={() => enabled && setMobileStep(item.step)}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                      active
                        ? 'bg-ink text-white'
                        : 'bg-slate-100 text-slate-500'
                    } ${!enabled ? 'opacity-40' : ''}`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>

            {mobileStep === 1 ? (
              <div className="grid min-w-0 gap-4">
                <div className="grid min-w-0 gap-3 [&_input]:min-w-0 [&_input]:w-full [&_select]:min-w-0 [&_select]:w-full">
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    First name
                    <input value={draft.firstName} onChange={(event) => setField('firstName', event.target.value)} className="rounded-2xl border-slate-200" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Middle name
                    <input value={draft.middleName} onChange={(event) => setField('middleName', event.target.value)} className="rounded-2xl border-slate-200" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Last name
                    <input value={draft.lastName} onChange={(event) => setField('lastName', event.target.value)} className="rounded-2xl border-slate-200" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Passport number
                    <input value={draft.passportNo} onChange={(event) => setField('passportNo', event.target.value.toUpperCase())} className="rounded-2xl border-slate-200" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-2 text-sm font-medium text-ink">
                      Gender
                      <select
                        value={draft.gender}
                        onChange={(event) => setField('gender', event.target.value as 'M' | 'F')}
                        className="rounded-2xl border-slate-200"
                      >
                        <option value="">Select</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-ink">
                      Nationality
                      <select
                        value={draft.nationality}
                        onChange={(event) => setField('nationality', event.target.value.toUpperCase())}
                        className="rounded-2xl border-slate-200"
                      >
                        <option value="">Select</option>
                        {countryOptions.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name} ({country.code})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Birth date
                    <input type="date" value={draft.birthDate} onChange={(event) => setField('birthDate', event.target.value)} className="rounded-2xl border-slate-200" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Phone
                    <input value={draft.phoneNo} onChange={(event) => setField('phoneNo', event.target.value)} className="rounded-2xl border-slate-200" />
                  </label>
                  <div className="grid gap-3">
                    <div className="grid gap-2 text-sm font-medium text-ink">
                      Check-in
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {draft.checkInDate}
                      </div>
                    </div>
                    <label className="grid gap-2 text-sm font-medium text-ink">
                      Check-out
                      <input type="date" min={todayThailandIso()} value={draft.checkOutDate} onChange={(event) => setField('checkOutDate', event.target.value)} className="rounded-2xl border-slate-200" />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    TM30 status
                    <select value={draft.status} onChange={(event) => setField('status', event.target.value as CheckinRecord['status'])} className="rounded-2xl border-slate-200">
                      <option value="draft">Draft</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="exported">Exported</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            {mobileStep === 2 ? (
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Room search
                    <input
                      value={roomSearch}
                      onChange={(event) => setRoomSearch(event.target.value)}
                      placeholder="Search by room code or name"
                      className="rounded-2xl border-slate-200"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-ink">
                    Room type
                    <select value={roomTypeFilter} onChange={(event) => setRoomTypeFilter(event.target.value as 'all' | 'private' | 'shared')} className="rounded-2xl border-slate-200">
                      <option value="all">All rooms</option>
                      <option value="private">Private only</option>
                      <option value="shared">Shared only</option>
                    </select>
                  </label>
                  <Button type="button" variant={showUnavailableRooms ? 'primary' : 'secondary'} onClick={() => setShowUnavailableRooms((current) => !current)} className="w-full">
                    {showUnavailableRooms ? 'Showing full rooms' : 'Hide full rooms'}
                  </Button>
                </div>

                <div className="h-[420px] overflow-y-auto pr-1">
                  <div className="grid gap-3">
                  {roomCards.map(({ room, availableBeds, isFull, roomNeedsCleaning }) => (
                    <button
                      key={room.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        setField('roomCode', room.code)
                        setField('bedNumber', '')
                      }}
                      className={`rounded-[24px] p-4 text-left text-white shadow-soft transition ${
                        draft.roomCode === room.code ? 'ring-2 ring-teal ring-offset-2 ring-offset-white' : ''
                      } ${isFull ? 'cursor-not-allowed opacity-50' : ''}`}
                      style={{ backgroundColor: roomNeedsCleaning ? '#f97316' : isFull ? '#64748b' : '#22c55e' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl font-semibold">{room.code}</p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/85">{room.section}</p>
                        </div>
                        {room.roomType === 'shared' ? <BedDouble size={16} className="text-white/90" /> : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          {room.roomType}
                        </span>
                        {room.roomType === 'shared' ? (
                          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            {availableBeds} available beds
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))}
                  </div>
                </div>
              </div>
            ) : null}

            {mobileStep === 3 ? (
              <div className="grid gap-4">
                {selectedRoom?.roomType === 'shared' ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">Choose bed in room {selectedRoom.code}</p>
                      <Button type="button" size="sm" variant={showUnavailableBeds ? 'primary' : 'secondary'} onClick={() => setShowUnavailableBeds((current) => !current)}>
                        {showUnavailableBeds ? 'Showing blocked beds' : 'Hide blocked beds'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {bedCards.map((bed) => (
                        <button
                          key={bed.bedNumber}
                          type="button"
                          disabled={bed.blocked}
                          onClick={() => setField('bedNumber', String(bed.bedNumber))}
                          className={`rounded-[20px] p-4 text-left text-white shadow-soft transition ${
                            draft.bedNumber === String(bed.bedNumber) ? 'ring-2 ring-teal ring-offset-2 ring-offset-white' : ''
                          } ${bed.blocked ? 'cursor-not-allowed opacity-50' : ''}`}
                          style={{ backgroundColor: bed.color }}
                        >
                          <p className="font-display text-lg font-semibold">{selectedRoom.code}-{bed.bedNumber}</p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-white/85">{bed.label}</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Private room selected. No extra bed selection is needed.
                  </div>
                )}

                {roomOccupants.length ? (
                  <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <UserRound size={16} />
                      Current occupants
                    </div>
                    <div className="mt-3 grid gap-2">
                      {roomOccupants.map((occupant) => (
                        <div key={occupant.id} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          <span className="font-semibold text-ink">
                            {selectedRoom?.roomType === 'shared' ? `Bed ${occupant.bedNumber}` : 'Private room'}
                          </span>
                          <span className="ml-2">{guestName(occupant)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-1 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
          <div className="flex justify-end gap-3">
            {mobileStep > 1 ? (
              <Button type="button" variant="secondary" onClick={() => setMobileStep((current) => (current === 3 ? 2 : 1))}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            )}
            {mobileStep === 1 ? (
              <Button type="button" onClick={handleMobileNextFromDetails}>
                Next
              </Button>
            ) : mobileStep === 2 ? (
              <Button type="button" onClick={handleMobileNextFromRoom} disabled={saving}>
                {selectedRoom?.roomType === 'shared' ? 'Next' : saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Confirm check-in'}
              </Button>
            ) : (
              <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
                {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Confirm check-in'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
