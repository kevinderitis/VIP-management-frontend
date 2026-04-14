import { FormEvent, useMemo, useState } from 'react'
import { BedDouble, ChevronDown, Grid2X2, MapPin, Pencil, Plus, Search, SendToBack, Trash2, UserCog, UserPlus } from 'lucide-react'
import { BulkBedTaskModal } from '../../components/admin/BulkBedTaskModal'
import { CleaningAreaEditorModal } from '../../components/admin/CleaningAreaEditorModal'
import { CleaningPlaceStatusModal } from '../../components/admin/CleaningPlaceStatusModal'
import { CleaningTaskAssignmentModal } from '../../components/admin/CleaningTaskAssignmentModal'
import { CleaningTaskEditorModal } from '../../components/admin/CleaningTaskEditorModal'
import { RoomStatusModal } from '../../components/admin/RoomStatusModal'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Modal } from '../../components/common/Modal'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useCleanerUsers, useVolunteerUsers } from '../../store/app-store'
import { CleaningArea, CleaningPlaceStatus, CleaningPlaceStatusDraftInput, CleaningRoom, Task } from '../../types/models'
import { formatDateTime, formatTimeRange } from '../../utils/format'

const sectionOrder = ['Arena Hostel', 'Arena Boutique / Seaview', 'Le Club']

const fallbackStatus = { label: 'No status', color: '#cbd5e1', beds: [] }
const activeTaskStatuses = ['assigned', 'available', 'scheduled']

const normalizeLabel = (value?: string) => value?.trim().toLowerCase() ?? ''

const deriveRoomBoardState = (room: CleaningRoom, customStatus: CleaningPlaceStatus | undefined, relatedTasks: Task[]) => {
  const activeTasks = relatedTasks.filter((task) => activeTaskStatuses.includes(task.status))
  const activeBedTasks = activeTasks.filter((task) => task.bedTask)
  const activeCleaningTask = activeTasks.find((task) => !task.bedTask)

  const bedLabels = customStatus?.beds.map((bed) => normalizeLabel(bed.label)) ?? []
  const roomServiceLabel = normalizeLabel(customStatus?.roomServiceLabel)

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
    Boolean(activeCleaningTask)

  const badges: Array<{ label: string; color: string }> = []

  if (hasOccupied) {
    badges.push({ label: 'Occupied', color: '#3b82f6' })
  }
  if (hasNeedsMaking) {
    badges.push({ label: 'Needs making', color: '#ef4444' })
  }
  if (hasCheck) {
    badges.push({ label: 'Check', color: '#f59e0b' })
  }
  if (hasNeedsCleaning) {
    badges.push({ label: 'Needs cleaning', color: '#ef4444' })
  }

  if (!badges.length) {
    badges.push({ label: 'Clean', color: '#22c55e' })
  }

  return {
    color: badges[0].color,
    primaryLabel: badges[0].label,
    badges,
    beds: customStatus?.beds ?? [],
    roomType: customStatus?.roomType ?? room.roomType,
  }
}

export const AdminCleaningTasksPage = () => {
  const tasks = useAppStore((state) => state.tasks)
  const cleaningAreas = useAppStore((state) => state.cleaningAreas)
  const cleaningRooms = useAppStore((state) => state.cleaningRooms)
  const cleaningPlaceStatuses = useAppStore((state) => state.cleaningPlaceStatuses)
  const createCleaningTask = useAppStore((state) => state.createCleaningTask)
  const updateCleaningTask = useAppStore((state) => state.updateCleaningTask)
  const publishCleaningTask = useAppStore((state) => state.publishCleaningTask)
  const toggleCleaningTaskCancelled = useAppStore((state) => state.toggleCleaningTaskCancelled)
  const deleteCleaningTask = useAppStore((state) => state.deleteCleaningTask)
  const assignCleaningTask = useAppStore((state) => state.assignCleaningTask)
  const createCleaningArea = useAppStore((state) => state.createCleaningArea)
  const updateCleaningArea = useAppStore((state) => state.updateCleaningArea)
  const toggleCleaningArea = useAppStore((state) => state.toggleCleaningArea)
  const deleteCleaningArea = useAppStore((state) => state.deleteCleaningArea)
  const createCleaningRoom = useAppStore((state) => state.createCleaningRoom)
  const upsertCleaningPlaceStatus = useAppStore((state) => state.upsertCleaningPlaceStatus)
  const bulkCreateBedTasks = useAppStore((state) => state.bulkCreateBedTasks)
  const cleaners = useCleanerUsers()
  const volunteers = useVolunteerUsers().filter((volunteer) => volunteer.isActive)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'private' | 'shared'>('all')
  const [sectionFilter, setSectionFilter] = useState<'all' | string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [roomCreateOpen, setRoomCreateOpen] = useState(false)
  const [bulkBedOpen, setBulkBedOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [assignmentTask, setAssignmentTask] = useState<Task | null>(null)
  const [selectedArea, setSelectedArea] = useState<CleaningArea | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<CleaningRoom | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Omit<CleaningPlaceStatusDraftInput, 'label' | 'color'> | null>(null)
  const [openAreaManageId, setOpenAreaManageId] = useState<string | null>(null)
  const [openTaskManageId, setOpenTaskManageId] = useState<string | null>(null)
  const [roomBoardOpen, setRoomBoardOpen] = useState(true)
  const [customPlacesOpen, setCustomPlacesOpen] = useState(true)
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

  const filteredTasks = useMemo(
    () =>
      cleaningTasks.filter((task) => {
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const searchValue = search.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(searchValue) ||
          task.description.toLowerCase().includes(searchValue) ||
          (task.cleaningLocationLabel ?? '').toLowerCase().includes(searchValue) ||
          (task.cleaningRoomCode ?? '').toLowerCase().includes(searchValue)
        return matchesStatus && matchesSearch
      }),
    [cleaningTasks, search, statusFilter],
  )

  const groupedRooms = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
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

          return { room, status: derivedStatus }
        }),
    }))

    return grouped.filter((group) => group.rooms.length > 0)
  }, [cleaningPlaceStatuses, cleaningRooms, roomTypeFilter, search, sectionFilter, tasks])

  const customPlaceCards = useMemo(
    () =>
      cleaningAreas.map((area) => {
        const customStatus = cleaningPlaceStatuses.find(
          (status) => status.placeType === 'custom' && status.cleaningAreaId === area.id,
        )
        const relatedTasks = cleaningTasks.filter(
          (task) => task.cleaningLocationType === 'custom' && task.cleaningLocationLabel === area.name,
        )
        const status =
          customStatus ??
          (relatedTasks.find((task) => ['assigned', 'available', 'scheduled'].includes(task.status))
            ? { label: 'Needs cleaning', color: '#ef4444', beds: [] }
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

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden">
      <SectionHeader
        eyebrow="Cleaning ops"
        title="Cleaning service tasks"
        description="Manage cleaning work, grouped room boards, custom places, and bed-making requests for volunteers."
        action={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button variant="secondary" onClick={() => setBulkBedOpen(true)} className="min-w-0 px-4 sm:px-5">
              <BedDouble size={16} className="mr-2" />
              Bulk bed
            </Button>
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
            <Button
              onClick={() => {
                setSelectedTask(null)
                setModalOpen(true)
              }}
              className="min-w-0 px-4 sm:px-5"
            >
              <Plus size={16} className="mr-2" />
              <span className="sm:hidden">Create task</span>
              <span className="hidden sm:inline">Create cleaning task</span>
            </Button>
          </div>
        }
      />

      <Panel className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, description, room code, or location"
              className="w-full rounded-2xl border-slate-200 pl-11"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border-slate-200"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Panel>

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
          <Button size="sm" variant="secondary" onClick={() => setBulkBedOpen(true)} className="whitespace-nowrap">
            <BedDouble size={15} className="mr-2" />
            Bulk bed
          </Button>
        </div>
        {roomBoardOpen ? (
          <>
            <p className="mt-2 text-sm text-slate-500">
              Rooms are grouped by property. Shared dorms open a bed view, while private rooms keep the simple status plus bed request flow.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[auto_auto] lg:items-start lg:justify-between">
          <div className="grid gap-3 sm:hidden">
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
          </div>

          <div className="hidden flex-wrap gap-2 sm:flex">
            <Button
              size="sm"
              variant={roomTypeFilter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setRoomTypeFilter('all')}
            >
              All rooms
            </Button>
            <Button
              size="sm"
              variant={roomTypeFilter === 'private' ? 'primary' : 'secondary'}
              onClick={() => setRoomTypeFilter('private')}
            >
              Private only
            </Button>
            <Button
              size="sm"
              variant={roomTypeFilter === 'shared' ? 'primary' : 'secondary'}
              onClick={() => setRoomTypeFilter('shared')}
            >
              Shared only
            </Button>
          </div>

          <div className="hidden flex-wrap gap-2 sm:flex">
            <Button
              size="sm"
              variant={sectionFilter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setSectionFilter('all')}
            >
              All locations
            </Button>
            {sectionOrder.map((section) => (
              <Button
                key={section}
                size="sm"
                variant={sectionFilter === section ? 'primary' : 'secondary'}
                onClick={() => setSectionFilter(section)}
              >
                {section}
              </Button>
            ))}
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
                {group.rooms.map(({ room, status }) => (
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
                    <div className="mt-4 flex flex-wrap gap-1.5">
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

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="No cleaning tasks match these filters"
          description="Try another search or create a new cleaning task."
        />
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => {
            const cleaner = cleaners.find((user) => user.id === task.assignedTo)
            return (
              <Panel key={task.id} className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {task.cleaningRoomCode ?? task.cleaningLocationLabel}
                      </span>
                    </div>
                    <h3 className="mt-3 break-words font-display text-xl font-semibold text-ink">{task.title}</h3>
                    <p className="mt-2 break-words text-sm text-slate-500">{task.description}</p>
                    <div className="mt-4 grid gap-2 text-sm text-slate-500 sm:flex sm:flex-wrap sm:gap-4">
                      <span>Publishes {formatDateTime(task.publishedAt)}</span>
                      <span>Happens {formatDateTime(task.scheduledAt ?? task.publishedAt)}</span>
                      <span>{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</span>
                      <span>{cleaner ? `Assigned to ${cleaner.name}` : 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="sm:hidden">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setAssignmentTask(task)
                          setAssignmentOpen(true)
                        }}
                      >
                        <UserPlus size={15} className="mr-2" />
                        {cleaner ? 'Reassign' : 'Assign'}
                      </Button>
                      <div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => setOpenTaskManageId(openTaskManageId === task.id ? null : task.id)}
                        >
                          <UserCog size={15} className="mr-2" />
                          Manage
                        </Button>
                        {openTaskManageId === task.id ? (
                          <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedTask(task)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil size={15} className="mr-2" />
                              Edit
                            </Button>
                            {task.status === 'draft' || task.status === 'scheduled' ? (
                              <Button variant="secondary" size="sm" className="w-full" onClick={() => publishCleaningTask(task.id)}>
                                <SendToBack size={15} className="mr-2" />
                                Publish
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="sm" className="w-full" onClick={() => toggleCleaningTaskCancelled(task.id)}>
                              <Trash2 size={15} className="mr-2" />
                              {task.status === 'cancelled' ? 'Reactivate' : 'Disable'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                if (!window.confirm(`Delete "${task.title}" permanently?`)) return
                                void deleteCleaningTask(task.id)
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="hidden flex-wrap gap-2 sm:flex">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setAssignmentTask(task)
                        setAssignmentOpen(true)
                      }}
                    >
                      <UserPlus size={15} className="mr-2" />
                      {cleaner ? 'Reassign' : 'Assign'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil size={15} className="mr-2" />
                      Edit
                    </Button>
                    {task.status === 'draft' || task.status === 'scheduled' ? (
                      <Button variant="secondary" size="sm" onClick={() => publishCleaningTask(task.id)}>
                        <SendToBack size={15} className="mr-2" />
                        Publish
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => toggleCleaningTaskCancelled(task.id)}>
                      <Trash2 size={15} className="mr-2" />
                      {task.status === 'cancelled' ? 'Reactivate' : 'Disable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm(`Delete "${task.title}" permanently?`)) return
                        void deleteCleaningTask(task.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <CleaningTaskEditorModal
        key={`${selectedTask?.id ?? 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={selectedTask}
        customAreas={cleaningAreas}
        rooms={cleaningRooms.filter((room) => room.isActive)}
        onSubmit={(input) => {
          if (selectedTask) {
            void updateCleaningTask(selectedTask.id, input)
            return
          }
          void createCleaningTask(input)
        }}
      />

      <CleaningTaskAssignmentModal
        key={`${assignmentTask?.id ?? 'none'}-${assignmentOpen ? 'open' : 'closed'}`}
        open={assignmentOpen}
        onClose={() => setAssignmentOpen(false)}
        task={assignmentTask}
        onSubmit={(cleanerId) => {
          if (!assignmentTask) return
          void assignCleaningTask(assignmentTask.id, cleanerId)
        }}
      />

      <CleaningAreaEditorModal
        key={`${selectedArea?.id ?? 'new'}-${areaOpen ? 'open' : 'closed'}`}
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
          key={`${selectedPlace.placeType}-${selectedPlace.roomCode ?? selectedPlace.cleaningAreaId ?? selectedPlace.placeLabel}`}
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          place={selectedPlace}
          currentStatus={currentStatus}
          cleaners={cleaners.filter((cleaner) => cleaner.isActive)}
          onSubmit={(input) => void upsertCleaningPlaceStatus(input)}
        />
      ) : null}

      {selectedRoom ? (
        <RoomStatusModal
          key={`${selectedRoom.id}-${roomModalOpen ? 'open' : 'closed'}`}
          open={roomModalOpen}
          onClose={() => setRoomModalOpen(false)}
          room={selectedRoom}
          currentStatus={currentRoomStatus}
          cleaners={cleaners.filter((cleaner) => cleaner.isActive)}
          volunteers={volunteers}
          roomTasks={tasks.filter((task) => task.cleaningLocationType === 'room' && task.cleaningRoomCode === selectedRoom.code)}
          onSubmit={(input) => void upsertCleaningPlaceStatus(input)}
        />
      ) : null}

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
                max={14}
                value={newRoom.roomType === 'private' ? 1 : newRoom.bedCount}
                onChange={(event) => setNewRoom((current) => ({ ...current, bedCount: Number(event.target.value) }))}
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
