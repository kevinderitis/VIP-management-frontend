import { useEffect, useMemo, useState } from 'react'
import { Camera, ChevronDown, Pencil, Plus, QrCode, Trash2 } from 'lucide-react'
import { CheckinStayEditorModal } from '../../components/admin/CheckinStayEditorModal'
import { PassportCameraCapture } from '../../components/admin/PassportCameraCapture'
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

export const AdminCheckInPage = () => {
  const token = useAppStore((state) => state.accessToken)
  const cleaningRooms = useAppStore((state) => state.cleaningRooms)
  const activeStays = useAppStore((state) => state.activeStays)
  const cleaningPlaceStatuses = useAppStore((state) => state.cleaningPlaceStatuses)
  const refreshState = useAppStore((state) => state.refreshState)
  const [selectedDate] = useState(todayIso())
  const [records, setRecords] = useState<CheckinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'scan-review' | 'manual' | 'edit'>('manual')
  const [editingRecord, setEditingRecord] = useState<CheckinRecord | null>(null)
  const [draftStayId, setDraftStayId] = useState<string | null>(null)

  const loadRecords = async () => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const response = await checkinsApi.list(token, selectedDate)
      setRecords(response.stays)
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not load check-in records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [selectedDate, token])

  const summary = useMemo(() => {
    const confirmed = records.filter((record) => record.status === 'confirmed').length
    const exported = records.filter((record) => record.status === 'exported').length
    return { total: records.length, confirmed, exported }
  }, [records])

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingRecord(null)
    setDraftStayId(null)
  }

  const handleCameraCapture = async (file: File) => {
    if (!token) return
    setSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('passportImageMrz', file)
      formData.append('checkInDate', selectedDate)

      const response = await checkinsApi.createDraftFromScan(token, formData)
      setDraftStayId(response.stayId)
      setEditingRecord({
        id: response.stayId,
        status: response.status,
        checkInDate: response.checkInDate,
        checkOutDate: response.checkOutDate,
        phoneNo: response.phoneNo,
        mrzScore: response.mrzScore,
        roomCode: response.roomCode,
        roomSection: response.roomSection,
        roomLabel: response.roomLabel,
        roomType: response.roomType,
        bedNumber: response.bedNumber,
        guest: response.guest,
      })
      setEditorMode('scan-review')
      setCameraOpen(false)
      setEditorOpen(true)
      await loadRecords()
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not process the passport.')
    } finally {
      setSaving(false)
    }
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
    if (!token) return
    setSaving(true)
    setError('')

    try {
      if (editorMode === 'manual') {
        await checkinsApi.createManual(token, {
          guest: input.guest,
          phoneNo: input.phoneNo,
          status: input.status,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          roomCode: input.roomCode,
          bedNumber: input.bedNumber,
        })
      } else {
        const stayId = editingRecord?.id || draftStayId
        if (!stayId) throw new Error('Missing stay id')

        await checkinsApi.update(token, stayId, {
          guest: input.guest,
          phoneNo: input.phoneNo,
          status: input.status,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          roomCode: input.roomCode,
          bedNumber: input.bedNumber,
        })
      }

      closeEditor()
      await Promise.all([loadRecords(), refreshState()])
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not save the passport record.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecord = async (record: CheckinRecord) => {
    if (!token) return
    if (!window.confirm(`Delete the record for ${record.guest?.firstName ?? 'this guest'}?`)) return

    try {
      await checkinsApi.remove(token, record.id)
      await Promise.all([loadRecords(), refreshState()])
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : 'Could not delete the record.')
    }
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Arrival flow"
        title="Check-in"
        description="Capture passports, place guests in rooms and beds, and keep the live occupancy synced with the room board."
        action={
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCameraOpen(true)}>
              <Camera size={16} className="mr-2" />
              Capture passport
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditorMode('manual')
                setEditingRecord(null)
                setDraftStayId(null)
                setEditorOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Manual entry
            </Button>
          </div>
        }
      />

      <AdminToolbar>
      <Panel className="admin-sticky-toolbar p-4">
        <div className="grid gap-3">
          <div className="flex items-center gap-2 sm:hidden">
            <Button onClick={() => setCameraOpen(true)} className="flex-1">
              <Camera size={16} className="mr-2" />
              Capture passport
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-11 w-11 shrink-0 px-0"
              onClick={() => {
                setEditorMode('manual')
                setEditingRecord(null)
                setDraftStayId(null)
                setEditorOpen(true)
              }}
            >
              <Plus size={18} />
            </Button>
          </div>

          <div className="hidden gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-end sm:grid">
            <div className="grid gap-2 text-sm font-medium text-ink">
              Check-in date
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {selectedDate}
              </div>
            </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-[20px] bg-slate-50 px-3 py-3 sm:rounded-[24px] sm:px-4 sm:py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">Records</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink sm:mt-2 sm:text-3xl">{summary.total}</p>
            </div>
            <div className="rounded-[20px] bg-slate-50 px-3 py-3 sm:rounded-[24px] sm:px-4 sm:py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">Confirmed</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink sm:mt-2 sm:text-3xl">{summary.confirmed}</p>
            </div>
            <div className="rounded-[20px] bg-slate-50 px-3 py-3 sm:rounded-[24px] sm:px-4 sm:py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">Exported</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink sm:mt-2 sm:text-3xl">{summary.exported}</p>
            </div>
          </div>
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
        </div>
      </Panel>
      </AdminToolbar>

      {error ? (
        <Panel className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Panel>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <Panel className="p-8 text-center text-slate-500">Loading check-in records...</Panel>
        ) : records.length ? (
          records.map((record) => {
            const occupantSummary =
              record.roomCode &&
              (record.roomType === 'shared' && record.bedNumber
                ? `Room ${record.roomCode}-${record.bedNumber}`
                : `Room ${record.roomCode}`)

            return (
              <Panel key={record.id} className="overflow-hidden p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-ink sm:text-xl">
                        {[record.guest?.firstName, record.guest?.middleName, record.guest?.lastName]
                          .filter(Boolean)
                          .join(' ') || 'Unnamed guest'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Passport {record.guest?.passportNo ?? '—'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{record.guest?.nationality ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {record.status}
                      </span>
                      <div className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition group-open:rotate-180">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Check-in {record.checkInDate}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Check-out {record.checkOutDate || 'Pending'}
                      </span>
                      {occupantSummary ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1">{occupantSummary}</span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Scanned score {record.mrzScore}/3
                      {record.phoneNo ? ` · Phone ${record.phoneNo}` : ''}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditorMode('edit')
                          setEditingRecord(record)
                          setDraftStayId(record.id)
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
                </details>
              </Panel>
            )
          })
        ) : (
          <EmptyState
            icon={<QrCode size={24} />}
            title="No passport records yet"
            description="Start with passport capture or enter the guest manually to create the first check-in record for this date."
          />
        )}
      </div>

      {cameraOpen && token ? (
        <PassportCameraCapture
          token={token}
          onCapture={(file) => void handleCameraCapture(file)}
          onCancel={() => setCameraOpen(false)}
          onManualEntry={() => {
            setCameraOpen(false)
            setEditorMode('manual')
            setEditingRecord(null)
            setDraftStayId(null)
            setEditorOpen(true)
          }}
        />
      ) : null}

      <CheckinStayEditorModal
        open={editorOpen}
        onClose={closeEditor}
        mode={editorMode}
        record={editingRecord}
        selectedDate={selectedDate}
        rooms={cleaningRooms}
        activeStays={activeStays as ActiveStay[]}
        placeStatuses={cleaningPlaceStatuses}
        saving={saving}
        onSave={handleSaveRecord}
      />
    </div>
  )
}
