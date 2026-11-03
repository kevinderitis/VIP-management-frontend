import { BedDouble, Sparkles, UserMinus } from 'lucide-react'
import { Task } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export type RemovedRoomState = 'Clean' | 'Occupied'

const roomName = (task: Task) =>
  task.cleaningRoomCode ? `Room ${task.cleaningRoomCode}` : (task.cleaningLocationLabel ?? task.title)

export const RemoveCleanerAssignmentModal = ({
  open,
  onClose,
  task,
  cleanerName,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  task: Task | null
  cleanerName: string
  onConfirm: (state: RemovedRoomState) => Promise<void> | void
}) => {
  if (!task) return null

  const isRoom = Boolean(task.cleaningRoomCode)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remove assignment"
      description={
        isRoom
          ? `${roomName(task)} will be removed from ${cleanerName}'s list and the cleaning task will be closed. What is the room state now?`
          : `${roomName(task)} will be removed from ${cleanerName}'s list. The place stays on the cleaning board as unassigned.`
      }
    >
      {isRoom ? (
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onConfirm('Occupied')}
            className="flex items-center gap-4 rounded-[24px] border-2 border-blue-200 bg-blue-50 px-5 py-4 text-left transition hover:border-blue-400"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <BedDouble size={22} />
            </span>
            <span>
              <span className="block font-semibold text-ink">Room is occupied</span>
              <span className="mt-0.5 block text-sm text-slate-600">
                The room board turns blue and the cleaning task is closed.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onConfirm('Clean')}
            className="flex items-center gap-4 rounded-[24px] border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-left transition hover:border-emerald-400"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Sparkles size={22} />
            </span>
            <span>
              <span className="block font-semibold text-ink">Room is clean</span>
              <span className="mt-0.5 block text-sm text-slate-600">
                The room board turns green and the cleaning task is closed.
              </span>
            </span>
          </button>

          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <Button type="button" variant="secondary" onClick={() => onConfirm('Clean')}>
            <UserMinus size={16} className="mr-2" />
            Remove assignment
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </Modal>
  )
}
