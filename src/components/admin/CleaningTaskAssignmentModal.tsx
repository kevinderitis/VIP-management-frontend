import { FormEvent, useMemo, useState } from 'react'
import { useCleanerUsers } from '../../store/app-store'
import { Task } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export const CleaningTaskAssignmentModal = ({
  open,
  onClose,
  task,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  task?: Task | null
  onSubmit: (cleanerId: string) => void
}) => {
  const cleaners = useCleanerUsers()
  const activeCleaners = useMemo(() => cleaners.filter((cleaner) => cleaner.isActive), [cleaners])
  const [cleanerId, setCleanerId] = useState(task?.assignedTo ?? activeCleaners[0]?.id ?? '')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cleanerId) return
    onSubmit(cleanerId)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task?.assignedTo ? 'Reassign cleaning task' : 'Assign cleaning task'}
      description={task ? `Choose who should clean "${task.cleaningLocationLabel ?? task.title}".` : 'Choose a cleaner.'}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Cleaner
          <select
            required
            value={cleanerId}
            onChange={(event) => setCleanerId(event.target.value)}
            className="rounded-2xl border-slate-200"
          >
            {activeCleaners.map((cleaner) => (
              <option key={cleaner.id} value={cleaner.id}>
                {cleaner.name} · {cleaner.shift}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-[24px] bg-mist p-4 text-sm text-slate-600">
          The cleaner will see this task in their daily queue and can still release it if someone else needs to take over.
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{task?.assignedTo ? 'Save assignment' : 'Assign task'}</Button>
        </div>
      </form>
    </Modal>
  )
}
