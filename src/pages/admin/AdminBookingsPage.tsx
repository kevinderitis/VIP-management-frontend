import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, RefreshCw } from 'lucide-react'
import { Button } from '../../components/common/Button'
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
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [toDate, setToDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().slice(0, 10)
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const grouped = useMemo(() => {
    const groups = new Map<string, Map<string, Booking[]>>()
    for (const booking of bookings) {
      const property = booking.property || 'Other'
      const room = booking.room || 'Unknown'
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
            <div className="flex border-b border-slate-200">
              <div className="w-44 shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Room
              </div>
              <div className="flex">
                {days.map((day) => (
                  <div
                    key={day}
                    className={`flex w-[34px] shrink-0 items-center justify-center border-l py-2 text-[10px] font-medium ${
                      day === today ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    {day.slice(8, 10)}
                  </div>
                ))}
              </div>
            </div>

            {grouped.map(([property, rooms]) => (
              <div key={property} className="mt-4">
                <p className="mb-2 text-sm font-semibold text-ink">{property}</p>
                {[...rooms.entries()].map(([room, roomBookings]) => {
                  const cleaningRoom = cleaningRooms.find((item) => item.code === room)
                  const bedCount = cleaningRoom?.roomType === 'private' ? 1 : Math.max(1, cleaningRoom?.bedCount ?? 1)
                  const bedNumbers = Array.from({ length: bedCount }, (_, index) => index + 1)

                  const bedNumberFor = (booking: Booking) => {
                    const parsed = Number.parseInt(String(booking.bed ?? ''), 10)
                    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= bedCount) return parsed
                    return 1
                  }

                  return (
                    <div key={room} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-sm font-semibold text-ink">Room {room}</p>
                      {bedNumbers.map((bed) => {
                        const bedBookings = roomBookings.filter((booking) => bedNumberFor(booking) === bed)
                        return (
                          <div key={bed} className="mb-2 flex items-center gap-3">
                            <div className="w-20 shrink-0 text-xs font-semibold text-slate-500">
                              Bed {bed}
                            </div>
                            <div className="relative h-10 flex-1 overflow-hidden rounded-xl bg-white" style={{ width: days.length * dayWidth }}>
                              {days.map((day, index) => (
                                <div
                                  key={day}
                                  className={`absolute top-0 bottom-0 border-l ${
                                    day === today ? 'border-amber-300 bg-amber-100/60' : 'border-slate-100'
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
                                    key={`${booking.name}-${booking.startDate}-${booking.endDate}-${bed}`}
                                    className="absolute top-1 flex h-8 items-center overflow-hidden rounded-xl px-2 text-xs font-semibold text-white shadow-soft"
                                    style={{
                                      left,
                                      width: Math.max(24, width),
                                      backgroundColor: stateColor(booking.state),
                                    }}
                                    title={`${booking.name} · ${toDateKey(booking.startDate)} to ${toDateKey(booking.endDate)} · ${stateLabel(booking.state)}`}
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
    </div>
  )
}
