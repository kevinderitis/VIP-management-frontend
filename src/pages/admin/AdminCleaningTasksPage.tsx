import { FormEvent, useMemo, useState } from 'react'
import { BedDouble, ChevronDown, Eye, EyeOff, Grid2X2, MapPin, Search, SprayCan, UserCog, UserRound, X } from 'lucide-react'
import { BulkBedTaskModal } from '../../components/admin/BulkBedTaskModal'
import { BulkRoomCleaningModal } from '../../components/admin/BulkRoomCleaningModal'
import { CleanerActivityPanel } from '../../components/admin/CleanerActivityPanel'
import { CleaningAreaEditorModal } from '../../components/admin/CleaningAreaEditorModal'
import { CleaningPlaceStatusModal } from '../../components/admin/CleaningPlaceStatusModal'
import { RoomStatusModal } from '../../components/admin/RoomStatusModal'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { checkinsApi } from '../../lib/checkins'
import {
  buildCleaningBroadcastMessage,
  collectPlacesNeedingCleaning,
  collectRoomsNeedingCleaning,
} from '../../lib/cleaning-broadcast'
import {
  isMessengerConfigured,
  sendMessengerMessage,
} from '../../lib/messenger'
import { addToast, useAppStore, useCleanerUsers, useVolunteerUsers } from '../../store/app-store'
import { CleaningArea, CleaningPlaceStatus, CleaningPlaceStatusDraftInput, CleaningRoom, Task } from '../../types/models'

const sectionOrder = ['Arena Hostel', 'Arena Boutique / Seaview', 'Le Club']

const fallbackStatus = { label: 'No status', color: '#cbd5e1', beds: [] }
const activeTaskStatuses = ['assigned', 'available', 'scheduled']

const normalizeLabel = (value?: string) => value?.trim().toLowerCase() ?? ''

const roomStatePresets: Record<string, { label: string; color: string }> = {
  clean: { label: 'Clean', color: '#22c55e' },
  'needs cleaning': { label: 'Needs cleaning', color: '#ef4444' },
  'need cleaning': { label: 'Needs cleaning', color: '#ef4444' },
  occupied: { label: 'Occupied', color: '#3b82f6' },
  'in progress': { label: 'In progress', color: '#f59e0b' },
}

const deriveRoomBoardState = (room: CleaningRoom, customStatus: CleaningPlaceStatus | undefined, relatedTasks: Task[]) => {
  const activeTasks = relatedTasks.filter((task) => activeTaskStatuses.includes(task.status))
  const activeBedTasks = activeTasks.filter((task) => task.bedTask)
  const activeCleaningTask = activeTasks.find((task) => task.audience === 'cleaning')
  const cleaningStarted = Boolean(activeCleaningTask?.startedAt)

  const bedLabels = customStatus?.beds.map((bed) => normalizeLabel(bed.label)) ?? []
  const roomServiceLabel = normalizeLabel(customStatus?.roomServiceLabel)
  const explicitState = roomStatePresets[roomServiceLabel]

  const hasOccupied = bedLabels.includes('occupied')
  const hasNeedsMaking =
    bedLabels.includes('needs making') ||
    activeBedTasks.some((task) => normalizeLabel(task.title).includes('make bed'))
  const hasCheck =
    bedLabels.includes('check') ||
    activeBedTasks.some((task) => normalizeLabel(task.title).includes('check bed'))
  const hasNeedsCleaning =
    roomServiceLabel === 'needs cleaning' ||
    roomServiceLabel === 'need cleaning' ||
    Boolean(activeCleaningTask && !cleaningStarted)

  const badges: Array<{ label: string; color: string }> = []
  const occupiedCount = customStatus?.beds.filter((bed) => normalizeLabel(bed.label) === 'occupied').length ?? 0
  const needsMakingCount =
    customStatus?.beds.filter((bed) => normalizeLabel(bed.label) === 'needs making').length ?? 0

  const pushBadge = (badge: { label: string; color: string }) => {
    if (!badges.some((current) => normalizeLabel(current.label) === normalizeLabel(badge.label))) {
      badges.push(badge)
    }
  }

  if (hasOccupied) {
    pushBadge({ label: occupiedCount > 0 ? `${occupiedCount} Occupied` : 'Occupied', color: '#3b82f6' })
  }
  if (hasNeedsMaking) {
    pushBadge({ label: needsMakingCount > 0 ? `${needsMakingCount} Needs making` : 'Needs making', color: '#ef4444' })
  }
  if (hasCheck) {
    pushBadge({ label: 'Check', color: '#f59e0b' })
  }
  if (hasNeedsCleaning) {
    pushBadge({ label: 'Needs cleaning', color: '#ef4444' })
  } else if (cleaningStarted) {
    pushBadge({ label: 'In progress', color: '#f59e0b' })
  }
  if (explicitState && explicitState.label !== 'Clean') {
    // "2 Occupied" already covers the occupied state, and needs cleaning /
    // in progress have their own badge above.
    const alreadyCovered =
      (explicitState.label === 'Occupied' && hasOccupied) ||
      (explicitState.label === 'Needs cleaning' && hasNeedsCleaning) ||
      (explicitState.label === 'In progress' && cleaningStarted)
    if (!alreadyCovered) pushBadge(explicitState)
  }

  const explicitPrimary = explicitState && explicitState.label !== 'Clean' ? explicitState : null
  const primary =
    cleaningStarted
      ? { label: 'In progress', color: '#f59e0b' }
      : hasNeedsCleaning
        ? { label: 'Needs cleaning', color: '#ef4444' }
        : (explicitPrimary ?? badges[0] ?? { label: 'Clean', color: '#22c55e' })

  if (!badges.length) pushBadge(primary)

  return {
    color: primary.color,
    primaryLabel: primary.label,
    badges,
    beds: customStatus?.beds ?? [],
    roomType: customStatus?.roomType ?? room.roomType,
    occupiedCount,
    needsMakingCount,
    cleanerId: activeCleaningTask?.assignedTo,
  }
}

export const AdminCleaningTasksPage = () => {
  const token = useAppStore((state) => state.accessToken)
  const refreshState = useAppStore((state) => state.refreshState)
  const tasks = useAppStore((state) => state.tasks)
  const cleaningAreas = useAppStore((state) => state.cleaningAreas)
  const cleaningRooms = useAppStore((state) => state.cleaningRooms)
  const activeStays = useAppStore((state) => state.activeStays)
  const cleaningPlaceStatuses = useAppStore((state) => state.cleaningPlaceStatuses)
  const assignCleaningTask = useAppStore((state) => state.assignCleaningTask)
  const unassignCleaningTask = useAppStore((state) => state.unassignCleaningTask)
  const createCleaningArea = useAppStore((state) => state.createCleaningArea)
  const updateCleaningArea = useAppStore((state) => state.updateCleaningArea)
  const toggleCleaningArea = useAppStore((state) => state.toggleCleaningArea)
  const deleteCleaningArea = useAppStore((state) => state.deleteCleaningArea)
  const createCleaningRoom = useAppStore((state) => state.createCleaningRoom)
  const updateCleaningRoom = useAppStore((state) => state.updateCleaningRoom)
  const upsertCleaningPlaceStatus = useAppStore((state) => state.upsertCleaningPlaceStatus)
  const bulkCreateBedTasks = useAppStore((state) => state.bulkCreateBedTasks)
  const bulkUpdateRoomCleaningStatus = useAppStore((state) => state.bulkUpdateRoomCleaningStatus)
  const cleaners = useCleanerUsers()
  const cleanerNames = useMemo(() => new Map(cleaners.map((cleaner) => [cleaner.id, cleaner.name])), [cleaners])
  const volunteers = useVolunteerUsers().filter((volunteer) => volunteer.isActive)

  const [roomBoardSearch, setRoomBoardSearch] = useState('')
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'private' | 'shared'>('all')
  const [sectionFilter, setSectionFilter] = useState<'all' | string>('all')
  const [hideCleanRooms, setHideCleanRooms] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [roomCreateOpen, setRoomCreateOpen] = useState(false)
  const [bulkBedOpen, setBulkBedOpen] = useState(false)
  const [bulkCleaningOpen, setBulkCleaningOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState<CleaningArea | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<CleaningRoom | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Omit<CleaningPlaceStatusDraftInput, 'label' | 'color'> | null>(null)
  const [openAreaManageId, setOpenAreaManageId] = useState<string | null>(null)
  const [roomBoardOpen, setRoomBoardOpen] = useState(true)
  const [cleanerActivityOpen, setCleanerActivityOpen] = useState(true)
  const [customPlacesOpen, setCustomPlacesOpen] = useState(true)
  const [sentMessengerKeys, setSentMessengerKeys] = useState<string[]>([])
  const [sendingMessenger, setSendingMessenger] = useState(false)
  const [newRoom, setNewRoom] = useState<{
    code: string
    section: string
    roomType: 'private' | 'shared'
    bedCount: number
  }>({
    code: '',
    section: 'Arena Hostel',
    roomType: 'private' as const,
    bedCount: 4,
  })

  const cleaningTasks = useMemo(
    () => tasks.filter((task) => task.audience === 'cleaning' && task.status !== 'completed'),
    [tasks],
  )

  const hasCleanerActivity = useMemo(
    () =>
      cleaningTasks.some(
        (task) => Boolean(task.assignedTo) && ['assigned', 'scheduled'].includes(task.status),
      ),
    [cleaningTasks],
  )

  // Empty panels hide themselves; as soon as a cleaner gets work assigned the
  // panel comes back. The Hide/Show cleaners button still overrides it while
  // there is something to show.
  const [previousHasCleanerActivity, setPreviousHasCleanerActivity] = useState(hasCleanerActivity)
  if (previousHasCleanerActivity !== hasCleanerActivity) {
    setPreviousHasCleanerActivity(hasCleanerActivity)
    if (hasCleanerActivity) setCleanerActivityOpen(true)
  }

  const showCleanerActivity = cleanerActivityOpen && hasCleanerActivity

  const needsCleaningKeys = useMemo(() => {
    const roomKeys = collectRoomsNeedingCleaning(cleaningRooms, cleaningPlaceStatuses, tasks, { cleanerNames }).map(
      (room) => `room:${room.code}`,
    )
    const placeKeys = collectPlacesNeedingCleaning(cleaningAreas, cleaningPlaceStatuses, tasks, { cleanerNames }).map(
      (place) => `custom:${place.name}`,
    )
    return [...roomKeys, ...placeKeys]
  }, [cleanerNames, cleaningAreas, cleaningPlaceStatuses, cleaningRooms, tasks])

  const pendingMessengerKeys = useMemo(
    () => needsCleaningKeys.filter((key) => !sentMessengerKeys.includes(key)),
    [needsCleaningKeys, sentMessengerKeys],
  )

  const sendPendingMessenger = async (keys?: string[]) => {
    const keysToSend = keys ?? pendingMessengerKeys
    if (!keysToSend.length) return
    const roomCodes = keysToSend.filter((key) => key.startsWith('room:')).map((key) => key.slice(5))
    const placeLabels = keysToSend.filter((key) => key.startsWith('custom:')).map((key) => key.slice(7))

    const rooms = collectRoomsNeedingCleaning(cleaningRooms, cleaningPlaceStatuses, tasks, { cleanerNames }).filter((room) =>
      roomCodes.includes(room.code),
    )
    const places = collectPlacesNeedingCleaning(cleaningAreas, cleaningPlaceStatuses, tasks, { cleanerNames }).filter((place) =>
      placeLabels.includes(place.name),
    )

    if (!rooms.length && !places.length) return

    setSendingMessenger(true)
    try {
      await sendMessengerMessage(buildCleaningBroadcastMessage({ rooms, places }, 'Needs cleaning'))
      setSentMessengerKeys((current) => [...new Set([...current, ...keysToSend])])
      useAppStore.setState((state) => ({
        toasts: addToast(state.toasts, 'Cleaning list sent', 'The Messenger group received the updated cleaning list.'),
      }))
    } catch (error) {
      useAppStore.setState((state) => ({
        toasts: addToast(
          state.toasts,
          'Messenger message failed',
          error instanceof Error ? error.message : 'The Messenger group could not be notified.',
          'warning',
        ),
      }))
    } finally {
      setSendingMessenger(false)
    }
  }

  const groupedRooms = useMemo(() => {
    const searchValue = roomBoardSearch.trim().toLowerCase()
    const rooms = cleaningRooms.filter((room) => {
      if (!room.isActive) return false
      if (roomTypeFilter !== 'all' && room.roomType !== roomTypeFilter) return false
      if (sectionFilter !== 'all' && room.section !== sectionFilter) return false
      if (!searchValue) return true

      return (
        room.code.toLowerCase().includes(searchValue) ||
        room.label.toLowerCase().includes(searchValue) ||
        room.section.toLowerCase().includes(searchValue)
      )
    })

    const grouped = sectionOrder.map((section) => ({
      section,
      rooms: rooms
        .filter((room) => room.section === section)
        .map((room) => {
          const customStatus = cleaningPlaceStatuses.find(
            (status) => status.placeType === 'room' && status.roomCode === room.code,
          )
          const relatedTasks = tasks.filter(
            (task) => task.cleaningLocationType === 'room' && task.cleaningRoomCode === room.code,
          )
          const derivedStatus = deriveRoomBoardState(room, customStatus, relatedTasks)
          const cleanerName = derivedStatus.cleanerId
            ? cleaners.find((cleaner) => cleaner.id === derivedStatus.cleanerId)?.name
            : undefined

          return { room, status: derivedStatus, cleanerName }
        })
        .filter(({ status }) => !hideCleanRooms || status.primaryLabel !== 'Clean'),
    }))

    return grouped.filter((group) => group.rooms.length > 0)
  }, [cleaningPlaceStatuses, cleaningRooms, cleaners, hideCleanRooms, roomBoardSearch, roomTypeFilter, sectionFilter, tasks])

  const customPlaceCards = useMemo(
    () =>
      cleaningAreas.map((area) => {
        const customStatus = cleaningPlaceStatuses.find(
          (status) => status.placeType === 'custom' && status.cleaningAreaId === area.id,
        )
        const relatedTasks = cleaningTasks.filter(
          (task) => task.cleaningLocationType === 'custom' && task.cleaningLocationLabel === area.name,
        )
        const activeTask = relatedTasks.find((task) => ['assigned', 'available', 'scheduled'].includes(task.status))
        const status =
          customStatus ??
          (activeTask
            ? activeTask.startedAt
              ? { label: 'In progress', color: '#f59e0b', beds: [] }
              : { label: 'Needs cleaning', color: '#ef4444', beds: [] }
            : fallbackStatus)

        return { area, status }
      }),
    [cleaningAreas, cleaningPlaceStatuses, cleaningTasks],
  )

  const currentStatus = useMemo(() => {
    if (!selectedPlace) return undefined
    return cleaningPlaceStatuses.find((status) =>
      selectedPlace.placeType === 'room'
        ? status.placeType === 'room' && status.roomCode === selectedPlace.roomCode
        : status.placeType === 'custom' && status.cleaningAreaId === selectedPlace.cleaningAreaId,
    )
  }, [cleaningPlaceStatuses, selectedPlace])

  const currentRoomStatus = useMemo(() => {
    if (!selectedRoom) return undefined
    return cleaningPlaceStatuses.find((status) => status.placeType === 'room' && status.roomCode === selectedRoom.code)
  }, [cleaningPlaceStatuses, selectedRoom])

  const handleCreateRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void createCleaningRoom({
      code: newRoom.code.trim(),
      section: newRoom.section,
      roomType: newRoom.roomType,
      bedCount: newRoom.roomType === 'private' ? 1 : newRoom.bedCount,
    })
    setRoomCreateOpen(false)
    setNewRoom({ code: '', section: 'Arena Hostel', roomType: 'private', bedCount: 4 })
  }

  const handleRemoveCleanerAssignment = async (task: Task, state: 'Clean' | 'Occupied') => {
    if (task.cleaningRoomCode) {
      await bulkUpdateRoomCleaningStatus({
        roomCodes: [task.cleaningRoomCode],
        label: state,
        color: state === 'Clean' ? '#22c55e' : '#3b82f6',
      })
      return
    }
    await unassignCleaningTask(task.id)
  }

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden">
      <SectionHeader
        eyebrow="Cleaning ops"
        title="Cleaning service tasks"
        description="Manage cleaning work, grouped room boards, custom places, and bed-making requests for volunteers."
        action={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:items-center">
            <Button variant="secondary" onClick={() => setRoomCreateOpen(true)} className="min-w-0">
              <BedDouble size={16} className="mr-2" />
              New room
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedArea(null)
                setAreaOpen(true)
              }}
              className="min-w-0"
            >
              <MapPin size={16} className="mr-2" />
              New location
            </Button>
          </div>
        }
      />

      <div
        className={`grid min-w-0 gap-6 ${
          showCleanerActivity ? 'xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start' : ''
        }`}
      >
        <div className="grid min-w-0 gap-6">
        <Panel className="overflow-hidden p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setRoomBoardOpen((current) => !current)}
            className="flex items-center gap-2 text-left"
          >
            <Grid2X2 size={18} className="text-teal" />
            <h3 className="section-title">Room board</h3>
            <span className={`rounded-2xl bg-slate-100 p-2 text-slate-500 transition ${roomBoardOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </span>
          </button>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBulkBedOpen(true)} className="whitespace-nowrap">
              <BedDouble size={15} className="mr-2" />
              Bulk bed
            </Button>
            <Button size="sm" onClick={() => setBulkCleaningOpen(true)} className="whitespace-nowrap">
              <SprayCan size={15} className="mr-2" />
              Bulk cleaning
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasCleanerActivity}
              onClick={() => setCleanerActivityOpen((current) => !current)}
              className="whitespace-nowrap"
            >
              {showCleanerActivity ? <EyeOff size={15} className="mr-2" /> : <Eye size={15} className="mr-2" />}
              {showCleanerActivity ? 'Hide cleaners' : 'Show cleaners'}
            </Button>
          </div>
        </div>
        {roomBoardOpen ? (
          <>
            <p className="mt-2 text-sm text-slate-500">
              Rooms are grouped by property. Shared dorms open a bed view, while private rooms keep the simple status plus bed request flow.
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px_auto] lg:items-start lg:justify-between">
              <label className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={roomBoardSearch}
                  onChange={(event) => setRoomBoardSearch(event.target.value)}
                  placeholder="Search room by number, code, or location"
                  className="w-full rounded-2xl border-slate-200 pl-11"
                />
              </label>

              <select
                value={roomTypeFilter}
                onChange={(event) => setRoomTypeFilter(event.target.value as 'all' | 'private' | 'shared')}
                className="w-full rounded-2xl border-slate-200"
              >
                <option value="all">All rooms</option>
                <option value="private">Private only</option>
                <option value="shared">Shared only</option>
              </select>

              <select
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                className="w-full rounded-2xl border-slate-200"
              >
                <option value="all">All locations</option>
                {sectionOrder.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  size="sm"
                  variant={hideCleanRooms ? 'primary' : 'secondary'}
                  onClick={() => setHideCleanRooms((current) => !current)}
                  className="w-full sm:w-auto"
                >
                  {hideCleanRooms ? 'Showing clean rooms' : 'Hide clean rooms'}
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-6">
          {groupedRooms.length ? groupedRooms.map((group) => (
            <div key={group.section} className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-display text-xl font-semibold text-ink">{group.section}</h4>
                <span className="text-sm text-slate-500">{group.rooms.length} rooms</span>
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
                {group.rooms.map(({ room, status, cleanerName }) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoom(room)
                      setRoomModalOpen(true)
                    }}
                    className="min-w-0 rounded-[24px] px-4 py-4 text-left text-white shadow-soft transition hover:-translate-y-0.5"
                    style={{ backgroundColor: status.color }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl font-semibold">{room.code}</p>
                        <p className="mt-1 break-words text-xs font-medium text-white/85">{room.roomType === 'shared' ? `${room.bedCount} beds` : 'Private room'}</p>
                      </div>
                      {room.roomType === 'shared' ? <BedDouble size={16} className="text-white/90" /> : null}
                    </div>
                    {cleanerName ? (
                      <p className="mt-2 flex items-start gap-1 break-words text-xs font-semibold text-white">
                        <UserRound size={13} className="mt-0.5 shrink-0" />
                        <span className="min-w-0 break-words">{cleanerName}</span>
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {status.badges.map((badge) => (
                        <span
                          key={`${room.code}-${badge.label}`}
                          className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
              No rooms match the selected filters.
            </div>
          )}
            </div>
          </>
        ) : null}
        </Panel>

      <Panel className="p-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setCustomPlacesOpen((current) => !current)}
            className="flex items-center gap-2 text-left"
          >
            <h3 className="section-title">Custom places</h3>
            <span className={`rounded-2xl bg-slate-100 p-2 text-slate-500 transition ${customPlacesOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </span>
          </button>
          <span className="text-sm text-slate-500">{cleaningAreas.length} saved</span>
        </div>
        {customPlacesOpen ? (
          <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customPlaceCards.map(({ area, status }) => (
            <div key={area.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{area.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{status.label}</p>
                </div>
                <span className="h-7 w-7 rounded-full border border-white shadow-soft" style={{ backgroundColor: status.color }} />
              </div>
              <div className="mt-4 sm:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedPlace({
                        placeType: 'custom',
                        cleaningAreaId: area.id,
                        placeLabel: area.name,
                      })
                      setStatusModalOpen(true)
                    }}
                  >
                    Status
                  </Button>
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setOpenAreaManageId(openAreaManageId === area.id ? null : area.id)}
                    >
                      <UserCog size={15} className="mr-2" />
                      Manage
                    </Button>
                    {openAreaManageId === area.id ? (
                      <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedArea(area)
                            setAreaOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => toggleCleaningArea(area.id)}>
                          {area.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (!window.confirm(`Delete "${area.name}" permanently?`)) return
                            void deleteCleaningArea(area.id)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-4 hidden gap-2 sm:flex">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedPlace({
                      placeType: 'custom',
                      cleaningAreaId: area.id,
                      placeLabel: area.name,
                    })
                    setStatusModalOpen(true)
                  }}
                >
                  Status
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedArea(area)
                    setAreaOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleCleaningArea(area.id)}>
                  {area.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!window.confirm(`Delete "${area.name}" permanently?`)) return
                    void deleteCleaningArea(area.id)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          </div>
        ) : null}
      </Panel>
        </div>

        <div className="grid min-w-0 gap-6">
        {showCleanerActivity ? (
          <CleanerActivityPanel
            tasks={tasks}
            cleaners={cleaners}
            onReassign={(taskId, cleanerId) => assignCleaningTask(taskId, cleanerId)}
            onRemove={handleRemoveCleanerAssignment}
          />
        ) : null}

        {pendingMessengerKeys.length ? (
          <Panel className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="section-title">Pending Messenger updates</h3>
              <span className="text-sm text-slate-500">{pendingMessengerKeys.length} unsent</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              These rooms or places are marked as needing cleaning but have not been sent to Messenger yet.
            </p>
            <ul className="mt-4 grid gap-2">
              {pendingMessengerKeys.map((key) => (
                <li key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-ink">
                  <span>{key.startsWith('room:') ? `Room ${key.slice(5)}` : key.slice(7)}</span>
                  <button
                    type="button"
                    aria-label="Remove from pending list"
                    onClick={() => setSentMessengerKeys((current) => [...new Set([...current, key])])}
                    className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={sendingMessenger || !isMessengerConfigured()}
                onClick={() => void sendPendingMessenger()}
              >
                {sendingMessenger ? 'Sending...' : 'Send pending to Messenger'}
              </Button>
              <Button
                variant="ghost"
                disabled={sendingMessenger}
                onClick={() => setSentMessengerKeys((current) => [...new Set([...current, ...pendingMessengerKeys])])}
              >
                Clear all
              </Button>
            </div>
          </Panel>
        ) : null}
      </div>




      </div>

      <CleaningAreaEditorModal
        key={`area-editor-${selectedArea?.id ?? 'new'}-${areaOpen ? 'open' : 'closed'}`}
        open={areaOpen}
        onClose={() => setAreaOpen(false)}
        area={selectedArea}
        onSubmit={(name) => {
          if (selectedArea) {
            void updateCleaningArea(selectedArea.id, name)
            return
          }
          void createCleaningArea(name)
        }}
      />

      {selectedPlace ? (
        <CleaningPlaceStatusModal
          key={`place-status-${selectedPlace.placeType}-${selectedPlace.roomCode ?? selectedPlace.cleaningAreaId ?? selectedPlace.placeLabel}`}
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          place={selectedPlace}
          currentStatus={currentStatus}
          cleaners={cleaners.filter((cleaner) => cleaner.isActive)}
          onSubmit={(input) => {
            const needsCleaning = ['need cleaning', 'needs cleaning'].includes(input.label.trim().toLowerCase())
            const key = input.placeType === 'room' ? `room:${input.roomCode}` : `custom:${input.placeLabel}`
            void (async () => {
              await upsertCleaningPlaceStatus(input)
              if (needsCleaning) {
                if (input.sendMessenger) {
                  await sendPendingMessenger([key])
                }
              } else {
                setSentMessengerKeys((current) => current.filter((item) => item !== key))
              }
            })()
          }}
        />
      ) : null}

      {selectedRoom ? (
        <RoomStatusModal
          key={`room-status-${selectedRoom.id}-${roomModalOpen ? 'open' : 'closed'}`}
          open={roomModalOpen}
          onClose={() => setRoomModalOpen(false)}
          room={selectedRoom}
          rooms={cleaningRooms.filter((room) => room.isActive)}
          roomStatuses={cleaningPlaceStatuses}
          currentStatus={currentRoomStatus}
          cleaners={cleaners.filter((cleaner) => cleaner.isActive)}
          volunteers={volunteers}
          roomTasks={tasks.filter((task) => task.cleaningLocationType === 'room' && task.cleaningRoomCode === selectedRoom.code)}
          activeStays={activeStays}
          onMoveStay={async (stayId, destination) => {
            if (!token) return
            await checkinsApi.move(token, stayId, destination)
            await refreshState()
          }}
          onRemoveStay={async (stayId) => {
            if (!token) return
            await checkinsApi.clearRoom(token, stayId)
            await refreshState()
          }}
          onSubmit={async (input, roomConfig) => {
            // Run the status update first so its optimistic state lands before
            // the room refresh, otherwise the board briefly reverts to the
            // previous color while the structural update is in flight.
            await upsertCleaningPlaceStatus(input)
            await updateCleaningRoom(selectedRoom.id, {
              code: selectedRoom.code,
              section: selectedRoom.section,
              roomType: roomConfig.roomType,
              bedCount: roomConfig.bedCount,
              bedTaskPoints: roomConfig.bedTaskPoints,
              checkTaskPoints: roomConfig.checkTaskPoints,
              trashTaskPoints: roomConfig.trashTaskPoints,
              isActive: selectedRoom.isActive,
            })

            const needsCleaning = ['need cleaning', 'needs cleaning'].includes(input.label.trim().toLowerCase())
            const key = `room:${input.roomCode}`
            if (needsCleaning) {
              if (input.sendMessenger) {
                await sendPendingMessenger([key])
              }
            } else {
              setSentMessengerKeys((current) => current.filter((item) => item !== key))
            }
          }}
        />
      ) : null}

      <BulkRoomCleaningModal
        open={bulkCleaningOpen}
        onClose={() => setBulkCleaningOpen(false)}
        groups={groupedRooms.map((group) => ({
          section: group.section,
          rooms: group.rooms.map(({ room, status }) => ({
            room,
            primaryLabel: status.primaryLabel,
            color: status.color,
          })),
        }))}
        cleaners={cleaners.filter((cleaner) => cleaner.isActive)}
        onConfirmStatusChange={(input) => bulkUpdateRoomCleaningStatus(input)}
      />

      <BulkBedTaskModal
        open={bulkBedOpen}
        onClose={() => setBulkBedOpen(false)}
        groups={groupedRooms.map((group) => ({
          section: group.section,
          rooms: group.rooms.map(({ room }) => ({
            room,
            status: cleaningPlaceStatuses.find(
              (status) => status.placeType === 'room' && status.roomCode === room.code,
            ),
          })),
        }))}
        volunteers={volunteers}
        onSubmit={(input) => void bulkCreateBedTasks(input)}
      />

      <Modal
        open={roomCreateOpen}
        onClose={() => setRoomCreateOpen(false)}
        title="New room"
        description="Add a new room to one of the properties so it appears in the cleaning board."
      >
        <form onSubmit={handleCreateRoom} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Room code
            <input
              required
              value={newRoom.code}
              onChange={(event) => setNewRoom((current) => ({ ...current, code: event.target.value }))}
              className="rounded-2xl border-slate-200"
              placeholder="41d or F8"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Property
            <select
              value={newRoom.section}
              onChange={(event) => setNewRoom((current) => ({ ...current, section: event.target.value }))}
              className="rounded-2xl border-slate-200"
            >
              {sectionOrder.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-ink">
              Room type
              <select
                value={newRoom.roomType}
                onChange={(event) =>
                  setNewRoom((current) => ({
                    ...current,
                    roomType: event.target.value as 'private' | 'shared',
                  }))
                }
                className="rounded-2xl border-slate-200"
              >
                <option value="private">Private</option>
                <option value="shared">Shared dorm</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Beds
              <input
                type="number"
                min={1}
                value={newRoom.roomType === 'private' ? 1 : newRoom.bedCount}
                onChange={(event) =>
                  setNewRoom((current) => ({ ...current, bedCount: Math.max(1, Number(event.target.value) || 1) }))
                }
                className="rounded-2xl border-slate-200"
                disabled={newRoom.roomType === 'private'}
              />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setRoomCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add room</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
