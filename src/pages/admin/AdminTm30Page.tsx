import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react'
import { CheckinStayEditorModal } from '../../components/admin/CheckinStayEditorModal'
import { AdminToolbar } from '../../components/common/AdminToolbar'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { checkinsApi } from '../../lib/checkins'
import { useAppStore } from '../../store/app-store'
import { ActiveStay, CheckinGuest, CheckinRecord } from '../../types/models'

const todayIso = () => {
  const now = new Date()
  const year = new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: 'Asia/Bangkok' }).format(now)
  const month = new Intl.DateTimeFormat('en-CA', { month: '2-digit', timeZone: 'Asia/Bangkok' }).format(now)
  const day = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: 'Asia/Bangkok' }).format(now)
  return `${year}-${month}-${day}`
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const AdminTm30Page = () => {
  const token = useAppStore((state) => state.accessToken)
  const cleaningRooms = useAppStore((state) => state.cleaningRooms)
  const activeStays = useAppStore((state) => state.activeStays)
  const cleaningPlaceStatuses = useAppStore((state) => state.cleaningPlaceStatuses)
  const refreshState = useAppStore((state) => state.refreshState)
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [records, setRecords] = useState<CheckinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CheckinRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | CheckinRecord['status']>('all')

  const loadRecords = async () => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const response = await checkinsApi.list(token, selectedDate)
      setRecords(response.stays)
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not load TM30 records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [selectedDate, token])

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => statusFilter === 'all' || record.status === statusFilter),
    [records, statusFilter],
  )

  const summary = useMemo(() => {
    const confirmed = records.filter((record) => record.status === 'confirmed').length
    const exported = records.filter((record) => record.status === 'exported').length
    return { total: records.length, confirmed, exported }
  }, [records])

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingRecord(null)
  }

  const handleSaveRecord = async (input: {
    guest: CheckinGuest
    phoneNo?: string
    status: CheckinRecord['status']
    checkInDate: string
    checkOutDate: string
    roomCode: string
    bedNumber?: number
  }) => {
    if (!token || !editingRecord) return
    setSaving(true)
    setError('')

    try {
      await checkinsApi.update(token, editingRecord.id, {
        guest: input.guest,
        phoneNo: input.phoneNo,
        status: input.status,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        roomCode: input.roomCode,
        bedNumber: input.bedNumber,
      })
      closeEditor()
      await Promise.all([loadRecords(), refreshState()])
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not update the TM30 record.')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    if (!token) return
    setExporting(true)
    setError('')

    try {
      const blob = await checkinsApi.exportTm30(token, selectedDate)
      downloadBlob(blob, `TM30_${selectedDate}.xlsx`)
      await Promise.all([loadRecords(), refreshState()])
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not export the TM30 file.')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteRecord = async (record: CheckinRecord) => {
    if (!token) return
    if (!window.confirm(`Delete the TM30 record for ${record.guest?.firstName ?? 'this guest'}?`)) {
      return
    }

    try {
      await checkinsApi.remove(token, record.id)
      await Promise.all([loadRecords(), refreshState()])
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not delete the TM30 record.')
    }
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Immigration records"
        title="TM30"
        description="Review passport records, edit room placements, and export the TM30 Excel file with the same structure as your existing project."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              <Download size={16} className="mr-2" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
            <Button
              onClick={() => {
                setEditingRecord({
                  id: '',
                  status: 'confirmed',
                  checkInDate: selectedDate,
                  checkOutDate: '',
                  phoneNo: '',
                  mrzScore: 0,
                  guest: {
                    passportNo: '',
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    gender: 'M',
                    nationality: '',
                    birthDate: '',
                  },
                })
                setEditorOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Add record manually
            </Button>
          </div>
        }
      />

      <AdminToolbar>
      <Panel className="admin-sticky-toolbar p-4">
        <div className="grid gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:hidden">
            <label className="grid gap-2 text-sm font-medium text-ink">
              Report date
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-2xl border-slate-200"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | CheckinRecord['status'])}
                className="rounded-2xl border-slate-200"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="exported">Exported</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <div className="rounded-[18px] bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Records</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{summary.total}</p>
            </div>
            <div className="rounded-[18px] bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Confirmed</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{summary.confirmed}</p>
            </div>
            <div className="rounded-[18px] bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Exported</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{summary.exported}</p>
            </div>
          </div>

        <div className="hidden gap-4 lg:grid-cols-[220px_220px_minmax(0,1fr)] lg:items-end sm:grid">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Report date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | CheckinRecord['status'])}
              className="rounded-2xl border-slate-200"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="exported">Exported</option>
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Total records</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{summary.total}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Confirmed</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{summary.confirmed}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Exported</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{summary.exported}</p>
            </div>
          </div>
        </div>
        </div>
      </Panel>
      </AdminToolbar>

      {error ? (
        <Panel className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Panel>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <Panel className="p-8 text-center text-slate-500">Loading TM30 records...</Panel>
        ) : filteredRecords.length ? (
          filteredRecords.map((record) => (
            <Panel key={record.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold text-ink">
                    {[record.guest?.firstName, record.guest?.middleName, record.guest?.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Unnamed guest'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Passport {record.guest?.passportNo ?? '—'} · {record.guest?.nationality ?? '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">{record.status}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Check-in {record.checkInDate}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Check-out {record.checkOutDate || 'Pending'}
                    </span>
                    {record.roomCode ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {record.roomType === 'shared' && record.bedNumber
                          ? `Room ${record.roomCode}-${record.bedNumber}`
                          : `Room ${record.roomCode}`}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingRecord(record)
                      setEditorOpen(true)
                    }}
                  >
                    <Pencil size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => void handleDeleteRecord(record)}>
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Panel>
          ))
        ) : (
          <EmptyState
            icon={<FileSpreadsheet size={24} />}
            title="No TM30 records yet"
            description="Use Check-in or add a manual record here, then export the Excel file once the day is ready."
          />
        )}
      </div>

      <CheckinStayEditorModal
        open={editorOpen}
        onClose={closeEditor}
        mode={editingRecord?.id ? 'edit' : 'manual'}
        record={editingRecord}
        selectedDate={selectedDate}
        rooms={cleaningRooms}
        activeStays={activeStays as ActiveStay[]}
        placeStatuses={cleaningPlaceStatuses}
        saving={saving}
        onSave={async (input) => {
          if (!token) return
          if (editingRecord?.id) {
            await handleSaveRecord(input)
            return
          }

          setSaving(true)
          setError('')
          try {
            await checkinsApi.createManual(token, {
              guest: input.guest,
              phoneNo: input.phoneNo,
              status: input.status,
              checkInDate: input.checkInDate,
              checkOutDate: input.checkOutDate,
              roomCode: input.roomCode,
              bedNumber: input.bedNumber,
            })
            closeEditor()
            await Promise.all([loadRecords(), refreshState()])
          } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Could not create the TM30 record.')
          } finally {
            setSaving(false)
          }
        }}
      />
    </div>
  )
}
