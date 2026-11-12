import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, RefreshCw } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'

type Booking = {
  name: string
  state: number
  comments: string
  room: string
  property: string | null
  type: string | null
  bed: string | number | null
  startDate: string
  endDate: string
}

const toDateKey = (value: string) => {
  if (!value) return ''
  if (value.includes('-')) return value
  if (value.length === 8) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  }
  return value
}

const parseDate = (value: string) => new Date(`${toDateKey(value)}T00:00:00`)

const toApiDate = (value: string) => value.replace(/-/g, '')

const dayDiff = (from: string, to: string) =>
  Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / (1000 * 60 * 60 * 24))

const stateColor = (state: number) => {
  if (state === 1) return '#f59e0b'
  if (state === 2) return '#3b82f6'
  if (state === 3) return '#22c55e'
  return '#94a3b8'
}

const stateLabel = (state: number) => {
  if (state === 1) return 'Pending check-in'
  if (state === 2) return 'Checked in'
  if (state === 3) return 'Checked out'
  return 'Unknown'
}

export const AdminBookingsPage = () => {
  const cleaningRooms = useAppStore((state) => state.cleaningRooms)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().slice(0, 10)
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const loadBookings = async () => {
    const token = import.meta.env.VITE_MESSENGER_API_TOKEN
    const apiUrl = import.meta.env.VITE_MESSENGER_API_URL
    const url = apiUrl
      ? apiUrl.replace('/api/messenger/send', '/api/hfsql/bookings/external')
      : 'http://localhost:3000/api/hfsql/bookings/external'

    const params = new URLSearchParams()
    params.set('fromDate', toApiDate(fromDate))
    if (toDate) params.set('toDate', toApiDate(toDate))

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setBookings(Array.isArray(data.bookings) ? data.bookings : [])
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message))
      setError(
        isNetworkError
          ? 'Not connected to Spinal. Open HostelOps Service.'
          : error instanceof Error
            ? error.message
            : 'Could not load bookings',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [])

  const days = useMemo(() => {
    const result: string[] = []
    const current = parseDate(fromDate)
    const end = parseDate(toDate)
    while (current <= end) {
      result.push(current.toISOString().slice(0, 10))
      current.setDate(current.getDate() + 1)
    }
    return result
  }, [fromDate, toDate])

  const today = new Date().toISOString().slice(0, 10)

  const monthGroups = useMemo(() => {
    const groups: { month: string; count: number }[] = []
    for (const day of days) {
      const month = parseDate(day).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      const last = groups[groups.length - 1]
      if (last && last.month === month) last.count += 1
      else groups.push({ month, count: 1 })
    }
    return groups
  }, [days])

  const grouped = useMemo(() => {
    const groups = new Map<string, Map<string, Booking[]>>()
    for (const booking of bookings) {
      const roomCode = String(booking.room || '').trim()
      if (!/^\\d+$/.test(roomCode)) continue
      const property = booking.property || 'Other'
      const room = roomCode
      if (!groups.has(property)) groups.set(property, new Map())
      const rooms = groups.get(property)!
      if (!rooms.has(room)) rooms.set(room, [])
      rooms.get(room)!.push(booking)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [bookings])

  const dayWidth = 34

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Reservations"
        title="Booking calendar"
        description="View current and future reservations across properties. Bars show each stay from check-in to check-out."
      />

      <Panel className="p-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-2 text-sm font-medium text-ink">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            To
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <Button onClick={() => void loadBookings()} disabled={loading}>
            <CalendarRange size={16} className="mr-2" />
            {loading ? 'Loading...' : 'Load bookings'}
          </Button>
          <Button variant="secondary" onClick={() => void loadBookings()} disabled={loading}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
            error.includes('Spinal')
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}>
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-max">
            <div className="sticky top-0 z-10 bg-white">
              <div className="flex border-b border-slate-200">
                <div className="w-44 shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Room
                </div>
                <div className="flex">
                  {monthGroups.map((group) => (
                    <div
                      key={group.month}
                      className="flex items-center justify-center border-l border-slate-200 bg-slate-50 py-1 text-[11px] font-semibold text-slate-600"
                      style={{ width: group.count * dayWidth }}
                    >
                      {group.month}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex border-b border-slate-200">
                <div className="w-44 shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Bed
                </div>
                <div className="flex">
                  {days.map((day) => (
                    <div
                      key={day}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`flex w-[34px] shrink-0 items-center justify-center border-l py-2 text-[10px] font-medium ${
                        day === today
                          ? 'border-amber-300 bg-amber-100 text-amber-800'
                          : hoveredDay === day
                            ? 'border-teal bg-teal/10 text-teal'
                            : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      {day.slice(8, 10)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {grouped.map(([property, rooms]) => (
              <div key={property} className="mt-4">
                <p className="mb-2 text-sm font-semibold text-ink">{property}</p>
                {[...rooms.entries()].map(([room, roomBookings]) => {
                  const cleaningRoom = cleaningRooms.find((item) => item.code === room)
                  const maxConcurrent = roomBookings.reduce((max, booking) => {
                    const count = roomBookings.filter((other) => {
                      const aStart = parseDate(toDateKey(booking.startDate)).getTime()
                      const aEnd = parseDate(toDateKey(booking.endDate)).getTime()
                      const bStart = parseDate(toDateKey(other.startDate)).getTime()
                      const bEnd = parseDate(toDateKey(other.endDate)).getTime()
                      return aStart <= bEnd && bStart <= aEnd
                    }).length
                    return Math.max(max, count)
                  }, 1)
                  const baseBedCount = cleaningRoom?.roomType === 'private' ? 1 : Math.max(1, cleaningRoom?.bedCount ?? 1)
                  const bedCount = cleaningRoom?.roomType === 'private' ? 1 : Math.max(baseBedCount, maxConcurrent)
                  const bedNumbers = Array.from({ length: bedCount }, (_, index) => index + 1)

                  const bedNumberFor = (booking: Booking, usedBeds: Set<number>) => {
                    const nameMatch = String(booking.name ?? '').match(/^(\d+)\s*[\/\-]/)
                    if (nameMatch) {
                      const parsed = Number.parseInt(nameMatch[1], 10)
                      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= bedCount) return parsed
                    }
                    const explicit = Number.parseInt(String(booking.bed ?? ''), 10)
                    if (!Number.isNaN(explicit) && explicit >= 1 && explicit <= bedCount && !usedBeds.has(explicit)) {
                      return explicit
                    }
                    for (let bed = 1; bed <= bedCount; bed += 1) {
                      if (!usedBeds.has(bed)) return bed
                    }
                    return 1
                  }

                  const overlaps = (a: Booking, b: Booking) => {
                    const aStart = parseDate(toDateKey(a.startDate)).getTime()
                    const aEnd = parseDate(toDateKey(a.endDate)).getTime()
                    const bStart = parseDate(toDateKey(b.startDate)).getTime()
                    const bEnd = parseDate(toDateKey(b.endDate)).getTime()
                    return aStart <= bEnd && bStart <= aEnd
                  }

                  const bookingBedMap = new Map<string, number>()
                  const bookingKey = (booking: Booking) => `${booking.name}-${booking.startDate}-${booking.endDate}`
                  const sortedBookings = [...roomBookings].sort((a, b) =>
                    parseDate(toDateKey(a.startDate)).getTime() - parseDate(toDateKey(b.startDate)).getTime(),
                  )
                  for (const booking of sortedBookings) {
                    const usedBeds = new Set(
                      sortedBookings
                        .filter((other) => other !== booking && overlaps(other, booking))
                        .map((other) => bookingBedMap.get(bookingKey(other)) ?? 0),
                    )
                    bookingBedMap.set(bookingKey(booking), bedNumberFor(booking, usedBeds))
                  }

                  const isPrivateRoom = cleaningRoom?.roomType === 'private'
                  const isExpanded = isPrivateRoom || expandedRooms.has(room)

                  return (
                    <div key={room} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPrivateRoom) return
                          setExpandedRooms((current) => {
                            const next = new Set(current)
                            if (next.has(room)) next.delete(room)
                            else next.add(room)
                            return next
                          })
                        }}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span className="text-sm font-semibold text-ink">Room {room}</span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                          {roomBookings.length} guest{roomBookings.length === 1 ? '' : 's'} {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>

                      {isExpanded ? (
                        <div className="mt-3">
                          {bedNumbers.map((bed) => {
                            const bedBookings = roomBookings.filter((booking) => bookingBedMap.get(bookingKey(booking)) === bed)
                            return (
                              <div key={bed} className="mb-2 flex items-center gap-3">
                                <div className="w-44 shrink-0 text-xs font-semibold text-slate-500">
                                  Bed {bed}
                                </div>
                                <div className="relative h-10 flex-1 overflow-hidden rounded-xl bg-white" style={{ width: days.length * dayWidth }}>
                                  {days.map((day, index) => (
                                    <div
                                      key={day}
                                      onMouseEnter={() => setHoveredDay(day)}
                                      className={`absolute top-0 bottom-0 border-l ${
                                        day === today
                                          ? 'border-amber-300 bg-amber-100/60'
                                          : hoveredDay === day
                                            ? 'border-teal bg-teal/10'
                                            : 'border-slate-100'
                                      }`}
                                      style={{ left: index * dayWidth, width: dayWidth }}
                                    />
                                  ))}
                                  {bedBookings.map((booking) => {
                                    const startOffset = dayDiff(fromDate, toDateKey(booking.startDate))
                                    const duration = Math.max(1, dayDiff(toDateKey(booking.startDate), toDateKey(booking.endDate)) + 1)
                                    const left = Math.max(0, startOffset) * dayWidth
                                    const width = duration * dayWidth - 4
                                    if (left > days.length * dayWidth) return null
                                    return (
                                      <div
                                        key={`${bookingKey(booking)}-${bed}`}
                                        className="absolute top-1 flex h-8 items-center overflow-hidden rounded-xl border border-white/40 px-2 text-xs font-semibold text-white shadow-soft"
                                        style={{
                                          left,
                                          width: Math.max(24, width),
                                          backgroundColor: stateColor(booking.state),
                                        }}
                                        title={`${booking.name} · ${toDateKey(booking.startDate)} to ${toDateKey(booking.endDate)} · ${stateLabel(booking.state)}`}
                                        onDoubleClick={() => setSelectedBooking(booking)}
                                      >
                                        <span className="truncate">{booking.name}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ))}

            {!grouped.length && !loading ? (
              <p className="mt-4 text-sm text-slate-500">No bookings found for this range.</p>
            ) : null}
          </div>
        </div>
      </Panel>

      <Modal
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking ? selectedBooking.name : 'Booking details'}
        description={selectedBooking ? `${stateLabel(selectedBooking.state)} · Room ${selectedBooking.room}` : ''}
        panelClassName="max-w-md"
      >
        {selectedBooking ? (
          <div className="grid gap-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Guest</p>
              <p className="mt-1 font-semibold text-ink">{selectedBooking.name}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Room</p>
              <p className="mt-1 font-semibold text-ink">Room {selectedBooking.room}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Property</p>
              <p className="mt-1 font-semibold text-ink">{selectedBooking.property || 'Unknown'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dates</p>
              <p className="mt-1 font-semibold text-ink">
                {toDateKey(selectedBooking.startDate)} to {toDateKey(selectedBooking.endDate)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
              <p className="mt-1 font-semibold text-ink">{stateLabel(selectedBooking.state)}</p>
            </div>
            {selectedBooking.comments ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Comments</p>
                <p className="mt-1 font-semibold text-ink">{selectedBooking.comments}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
