import { useEffect, useState } from 'react'
import { Check, UserRound } from 'lucide-react'
import { Task, User } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const roomName = (task: Task) =>
  task.cleaningRoomCode ? `Room ${task.cleaningRoomCode}` : (task.cleaningLocationLabel ?? task.title)

export const ChangeCleanerAssignmentModal = ({
  open,
  onClose,
  task,
  cleaners,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  task: Task | null
  cleaners: User[]
  onConfirm: (cleanerId: string) => Promise<void> | void
}) => {
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)

  const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  const todayWeekday = weekdayKeys[new Date().getDay()]
  const selectedCleaner = cleaners.find((cleaner) => cleaner.id === selectedId)
  const isCleanerOffToday = Boolean(selectedCleaner && selectedCleaner.offDay === todayWeekday)

  useEffect(() => {
    if (!open) return
    setSelectedId(task?.assignedTo ?? '')
    setSaving(false)
  }, [open, task?.id, task?.assignedTo])

  if (!task) return null

  const options = cleaners.filter((cleaner) => cleaner.isActive || cleaner.id === task.assignedTo)
  const currentName = cleaners.find((cleaner) => cleaner.id === task.assignedTo)?.name ?? 'Unassigned'
  const canSave = Boolean(selectedId) && selectedId !== task.assignedTo && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onConfirm(selectedId)
    } finally {
      setSaving(false)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change cleaner"
      description={`${roomName(task)} is currently assigned to ${currentName}. Choose another cleaner for this task.`}
    >
      <div className="grid gap-3">
        <div className="grid max-h-[46vh] gap-2 overflow-y-auto">
          {options.map((cleaner) => {
            const selected = selectedId === cleaner.id
            const current = cleaner.id === task.assignedTo
            return (
              <button
                key={cleaner.id}
                type="button"
                onClick={() => setSelectedId(cleaner.id)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  selected ? 'border-teal bg-teal/5 shadow-soft' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-teal text-white' : 'bg-white text-slate-500'}`}>
                    <UserRound size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{cleaner.name}</span>
                    {current ? <span className="block text-xs text-slate-500">Currently assigned</span> : null}
                  </span>
                </span>
                {selected ? <Check size={18} className="shrink-0 text-teal" /> : null}
              </button>
            )
          })}
          {!options.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-6 text-sm text-slate-500">
              No active cleaners available.
            </div>
          ) : null}
        </div>

        {isCleanerOffToday ? (
          <p className="text-sm font-semibold text-amber-600">
            This cleaner is off today and may not be available.
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSave} onClick={() => void handleSave()}>
            {saving ? 'Assigning…' : 'Save assignment'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
