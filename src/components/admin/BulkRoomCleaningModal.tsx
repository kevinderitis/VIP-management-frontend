import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, ChevronDown, Copy, Eye, Search, Send } from 'lucide-react'
import { buildCleaningBroadcastMessage } from '../../lib/cleaning-broadcast'
import { getMessengerChatId, isMessengerConfigured, sendMessengerMessage } from '../../lib/messenger'
import { CleaningRoom } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export type RoomBoardEntry = {
  room: CleaningRoom
  primaryLabel: string
  color: string
}

export type RoomBoardGroup = {
  section: string
  rooms: RoomBoardEntry[]
}

const statusPresets = [
  { label: 'Needs cleaning', color: '#ef4444' },
  { label: 'In progress', color: '#3b82f6' },
  { label: 'Clean', color: '#22c55e' },
]

export const BulkRoomCleaningModal = ({
  open,
  onClose,
  groups,
  onConfirmStatusChange,
}: {
  open: boolean
  onClose: () => void
  groups: RoomBoardGroup[]
  onConfirmStatusChange: (input: { roomCodes: string[]; label: string; color: string }) => Promise<void> | void
}) => {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [statusLabel, setStatusLabel] = useState(statusPresets[0].label)
  const [statusColor, setStatusColor] = useState(statusPresets[0].color)
  const [search, setSearch] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedCodes(new Set())
    setStatusLabel(statusPresets[0].label)
    setStatusColor(statusPresets[0].color)
    setSearch('')
    setMessageDraft('')
    setSendError(null)
    setSending(false)
    setCopied(false)
    setMessageOpen(false)
  }, [open])

  const allRooms = useMemo(() => groups.flatMap((g) => g.rooms), [groups])

  const filteredGroups = useMemo(() => {
    const value = search.trim().toLowerCase()
    if (!value) return groups
    return groups
      .map((group) => ({
        ...group,
        rooms: group.rooms.filter(
          (entry) =>
            entry.room.code.toLowerCase().includes(value) ||
            entry.room.label.toLowerCase().includes(value) ||
            entry.room.section.toLowerCase().includes(value),
        ),
      }))
      .filter((group) => group.rooms.length > 0)
  }, [groups, search])

  const selectedRooms = useMemo(
    () => allRooms.filter((entry) => selectedCodes.has(entry.room.code)),
    [allRooms, selectedCodes],
  )

  // Auto-regenerate the Messenger preview when selection or status changes,
  // unless the user already edited the draft manually (keep simple: always
  // regenerate until user types).
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    if (!open || dirty) return
    if (!selectedRooms.length) {
      setMessageDraft('')
      return
    }
    setMessageDraft(
      buildCleaningBroadcastMessage(
        selectedRooms.map((entry) => ({
          code: entry.room.code,
          section: entry.room.section,
          roomType: entry.room.roomType,
          label: entry.room.label,
        })),
        statusLabel,
      ),
    )
  }, [open, dirty, selectedRooms, statusLabel])

  useEffect(() => {
    if (!open) setDirty(false)
  }, [open])

  const toggleRoom = (code: string) => {
    setSelectedCodes((current) => {
      const next = new Set(current)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleSection = (sectionRooms: RoomBoardEntry[]) => {
    setSelectedCodes((current) => {
      const next = new Set(current)
      const everySelected = sectionRooms.every((entry) => next.has(entry.room.code))
      if (everySelected) sectionRooms.forEach((entry) => next.delete(entry.room.code))
      else sectionRooms.forEach((entry) => next.add(entry.room.code))
      return next
    })
  }

  const handleCopy = async () => {
    if (!messageDraft) return
    try {
      await navigator.clipboard.writeText(messageDraft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setSendError('Could not copy to clipboard. Select the text manually.')
    }
  }

  const handleSend = async () => {
    if (!selectedRooms.length || sending) return
    setSending(true)
    setSendError(null)
    const message = messageDraft.trim() || buildCleaningBroadcastMessage(
      selectedRooms.map((entry) => ({
        code: entry.room.code,
        section: entry.room.section,
        roomType: entry.room.roomType,
        label: entry.room.label,
      })),
      statusLabel,
    )
    const payload = {
      roomCodes: selectedRooms.map((entry) => entry.room.code),
      label: statusLabel,
      color: statusColor,
    }

    // Flow: send to Messenger, then close the modal AT ONCE and apply the
    // room status change in the background. Awaiting the full refreshState
    // before closing is what left the button stuck on "Sending…".
    try {
      await sendMessengerMessage(message)
    } catch (error) {
      try {
        await navigator.clipboard.writeText(message)
      } catch {
        // clipboard may be unavailable; status change still proceeds
      }
      console.warn('Messenger send failed, status still updating:', error)
    }

    onClose()
    // Fire-and-forget: the store shows its own toast when the refresh lands.
    void Promise.resolve(onConfirmStatusChange(payload)).catch((error) => {
      console.warn('Bulk status update failed:', error)
    })
    setSending(false)
  }

  const handleStatusOnly = () => {
    if (!selectedRooms.length || sending) return
    const payload = {
      roomCodes: selectedRooms.map((entry) => entry.room.code),
      label: statusLabel,
      color: statusColor,
    }
    // Same fast pattern: close at once, update in the background.
    onClose()
    void Promise.resolve(onConfirmStatusChange(payload)).catch((error) => {
      console.warn('Bulk status update failed:', error)
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk room cleaning"
      description="Select many rooms, change their cleaning status at once, and broadcast the list to the cleaning Messenger group."
      panelClassName="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-6xl self-end rounded-t-[28px] rounded-b-none p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:h-auto sm:max-h-[90vh] sm:self-auto sm:rounded-[28px] sm:p-6"
      bodyClassName="mt-4 min-h-0 overflow-hidden"
    >
      <div className="grid gap-4 lg:h-[74vh] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-h-0 lg:overflow-y-auto lg:pr-1">
          <label className="relative block">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search room by code or section"
              className="w-full rounded-2xl border-slate-200 pl-11"
            />
          </label>

          <div className="mt-4 space-y-5">
            {filteredGroups.map((group) => {
              const selectedInSection = group.rooms.filter((entry) => selectedCodes.has(entry.room.code)).length
              return (
                <div key={group.section} className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-display text-lg font-semibold text-ink">{group.section}</h4>
                    <Button size="sm" variant="secondary" onClick={() => toggleSection(group.rooms)}>
                      <CheckSquare size={15} className="mr-2" />
                      {selectedInSection === group.rooms.length && group.rooms.length > 0
                        ? 'Clear section'
                        : `Select section (${selectedInSection}/${group.rooms.length})`}
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {group.rooms.map((entry) => {
                      const selected = selectedCodes.has(entry.room.code)
                      return (
                        <button
                          key={entry.room.id}
                          type="button"
                          onClick={() => toggleRoom(entry.room.code)}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            selected ? 'border-teal bg-teal/5 shadow-soft' : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-ink">Room {entry.room.code}</span>
                            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          </div>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {entry.room.roomType === 'shared' ? `${entry.room.bedCount} beds` : 'Private'} · {entry.primaryLabel}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-teal">{selected ? 'Selected ✓' : 'Tap to select'}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {!filteredGroups.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
                No rooms match the search.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-ink">New status for {selectedRooms.length} room(s)</p>
            <div className="mt-3 grid gap-2">
              {statusPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setStatusLabel(preset.label)
                    setStatusColor(preset.color)
                    setDirty(false)
                  }}
                  className={`rounded-2xl border px-4 py-2.5 text-left transition ${
                    statusLabel === preset.label ? 'border-teal bg-teal/8 shadow-soft' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.color }} />
                    <span className="text-sm font-semibold text-ink">{preset.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Same as assigning to a cleaner, but tasks stay unassigned (AVAILABLE) for the group.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setMessageOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                <Eye size={16} className="text-slate-400" />
                {messageOpen ? 'Hide message' : 'View / edit message'}
              </span>
              <span className={`rounded-2xl bg-slate-100 p-1.5 text-slate-500 transition ${messageOpen ? 'rotate-180' : ''}`}>
                <ChevronDown size={16} />
              </span>
            </button>
            <p className="mt-1 text-xs text-slate-500">
              {selectedRooms.length
                ? `${selectedRooms.length} room(s) will be listed.`
                : 'Select rooms to generate the message.'}
            </p>
            {messageOpen ? (
              <div className="mt-3">
                <textarea
                  value={messageDraft}
                  onChange={(event) => {
                    setMessageDraft(event.target.value)
                    setDirty(true)
                  }}
                  rows={8}
                  placeholder={selectedRooms.length ? 'Generating message…' : 'Select rooms to generate the message.'}
                  className="w-full rounded-2xl border-slate-200 font-mono text-xs"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Chat: <span className="font-mono font-semibold">{getMessengerChatId() || 'not set'}</span>
                    {!isMessengerConfigured() ? ' — set token + chat id to enable send.' : null}
                  </p>
                  <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!messageDraft}>
                    <Copy size={15} className="mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {sendError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sendError}</div>
          ) : null}

          <div className="grid gap-2">
            <Button type="button" disabled={selectedRooms.length === 0 || sending} onClick={handleSend}>
              <Send size={15} className="mr-2" />
              {sending ? 'Sending…' : `Send to Messenger + mark ${statusLabel} (${selectedRooms.length})`}
            </Button>
            <Button type="button" variant="secondary" disabled={selectedRooms.length === 0 || sending} onClick={handleStatusOnly}>
              Only change status (no Messenger send)
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
