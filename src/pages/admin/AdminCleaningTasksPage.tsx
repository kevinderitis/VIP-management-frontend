import { useMemo, useState } from 'react'
import { Grid2X2, MapPin, Pencil, Plus, Search, SendToBack, Trash2, UserPlus } from 'lucide-react'
import { CleaningAreaEditorModal } from '../../components/admin/CleaningAreaEditorModal'
import { CleaningPlaceStatusModal } from '../../components/admin/CleaningPlaceStatusModal'
import { CleaningTaskAssignmentModal } from '../../components/admin/CleaningTaskAssignmentModal'
import { CleaningTaskEditorModal } from '../../components/admin/CleaningTaskEditorModal'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useCleanerUsers } from '../../store/app-store'
import { CleaningArea, CleaningPlaceStatusDraftInput, Task } from '../../types/models'
import { formatDateTime, formatTimeRange } from '../../utils/format'

const roomRanges = [
  { label: '1-100', start: 1 },
  { label: '101-200', start: 101 },
  { label: '201-300', start: 201 },
]

export const AdminCleaningTasksPage = () => {
  const tasks = useAppStore((state) => state.tasks)
  const cleaningAreas = useAppStore((state) => state.cleaningAreas)
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
  const upsertCleaningPlaceStatus = useAppStore((state) => state.upsertCleaningPlaceStatus)
  const cleaners = useCleanerUsers()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [assignmentTask, setAssignmentTask] = useState<Task | null>(null)
  const [selectedArea, setSelectedArea] = useState<CleaningArea | null>(null)
  const [selectedRoomRange, setSelectedRoomRange] = useState(1)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Omit<CleaningPlaceStatusDraftInput, 'label' | 'color'> | null>(null)

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
          (task.cleaningLocationLabel ?? '').toLowerCase().includes(searchValue)
        return matchesStatus && matchesSearch
      }),
    [cleaningTasks, search, statusFilter],
  )

  const roomSquares = useMemo(() => {
    const squares = Array.from({ length: 100 }, (_, index) => selectedRoomRange + index)
    return squares.map((roomNumber) => {
      const roomLabel = `Room ${roomNumber}`
      const customStatus = cleaningPlaceStatuses.find(
        (status) => status.placeType === 'room' && status.roomNumber === roomNumber,
      )
      const relatedTasks = cleaningTasks.filter(
        (task) => task.cleaningLocationType === 'room' && task.cleaningRoomNumber === roomNumber,
      )

      const fallback =
        relatedTasks.find((task) => ['assigned', 'available', 'scheduled'].includes(task.status))
          ? { label: 'Needs cleaning', color: '#ef4444' }
          : relatedTasks.find((task) => task.status === 'completed')
            ? { label: 'Clean', color: '#22c55e' }
            : { label: 'No status', color: '#cbd5e1' }

      return {
        roomNumber,
        roomLabel,
        status: customStatus ?? fallback,
      }
    })
  }, [cleaningPlaceStatuses, cleaningTasks, selectedRoomRange])

  const customPlaceCards = useMemo(
    () =>
      cleaningAreas.map((area) => {
        const customStatus = cleaningPlaceStatuses.find(
          (status) => status.placeType === 'custom' && status.cleaningAreaId === area.id,
        )
        const relatedTasks = cleaningTasks.filter(
          (task) => task.cleaningLocationType === 'custom' && task.cleaningLocationLabel === area.name,
        )
        const fallback =
          relatedTasks.find((task) => ['assigned', 'available', 'scheduled'].includes(task.status))
            ? { label: 'Needs cleaning', color: '#ef4444' }
            : relatedTasks.find((task) => task.status === 'completed')
              ? { label: 'Clean', color: '#22c55e' }
              : { label: 'No status', color: '#cbd5e1' }

        return {
          area,
          status: customStatus ?? fallback,
        }
      }),
    [cleaningAreas, cleaningPlaceStatuses, cleaningTasks],
  )

  const currentStatus = useMemo(() => {
    if (!selectedPlace) return undefined
    return cleaningPlaceStatuses.find((status) =>
      selectedPlace.placeType === 'room'
        ? status.placeType === 'room' && status.roomNumber === selectedPlace.roomNumber
        : status.placeType === 'custom' && status.cleaningAreaId === selectedPlace.cleaningAreaId,
    )
  }, [cleaningPlaceStatuses, selectedPlace])

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Cleaning ops"
        title="Cleaning service tasks"
        description="Create room or custom-place cleaning tasks, assign them to cleaning staff, and manage cleaning conditions visually."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedArea(null)
                setAreaOpen(true)
              }}
            >
              <MapPin size={16} className="mr-2" />
              New location
            </Button>
            <Button
              onClick={() => {
                setSelectedTask(null)
                setModalOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Create cleaning task
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
              placeholder="Search by title, description, or location"
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

      <Panel className="p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Grid2X2 size={18} className="text-teal" />
              <h3 className="section-title">Room map</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Use colors to track room and place conditions. Setting a place to Need cleaning will open or republish a cleaning task automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roomRanges.map((range) => (
              <Button
                key={range.start}
                variant={selectedRoomRange === range.start ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedRoomRange(range.start)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
          {roomSquares.map((room) => (
            <button
              key={room.roomNumber}
              type="button"
              onClick={() => {
                setSelectedPlace({
                  placeType: 'room',
                  roomNumber: room.roomNumber,
                  placeLabel: room.roomLabel,
                })
                setStatusModalOpen(true)
              }}
              className="rounded-2xl px-2 py-3 text-center text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
              style={{ backgroundColor: room.status.color }}
              title={`${room.roomLabel} · ${room.status.label}`}
            >
              {room.roomNumber}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#22c55e]" />Clean</span>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#ef4444]" />Needs cleaning</span>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#3b82f6]" />Custom state</span>
        </div>
      </Panel>

      <Panel className="p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="section-title">Custom places</h3>
          <span className="text-sm text-slate-500">{cleaningAreas.length} saved</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customPlaceCards.map(({ area, status }) => (
            <div key={area.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{area.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{status.label}</p>
                </div>
                <span className="h-7 w-7 rounded-full border border-white shadow-soft" style={{ backgroundColor: status.color }} />
              </div>
              <div className="mt-4 flex gap-2">
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
                        {task.cleaningLocationLabel}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold text-ink">{task.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{task.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>Publishes {formatDateTime(task.publishedAt)}</span>
                      <span>Happens {formatDateTime(task.scheduledAt ?? task.publishedAt)}</span>
                      <span>{formatTimeRange(task.scheduledAt ?? task.publishedAt, task.endsAt)}</span>
                      <span>{cleaner ? `Assigned to ${cleaner.name}` : 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
          key={`${selectedPlace.placeType}-${selectedPlace.roomNumber ?? selectedPlace.cleaningAreaId ?? selectedPlace.placeLabel}`}
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          place={selectedPlace}
          currentStatus={currentStatus}
          cleaners={cleaners.filter((cleaner) => cleaner.isActive)}
          onSubmit={(input) => void upsertCleaningPlaceStatus(input)}
        />
      ) : null}
    </div>
  )
}
