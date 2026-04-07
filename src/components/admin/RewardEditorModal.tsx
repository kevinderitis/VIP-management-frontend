import { FormEvent, useState } from 'react'
import { Reward, RewardDraftInput } from '../../types/models'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const emptyForm: RewardDraftInput = {
  name: '',
  description: '',
  cost: 60,
  category: 'Food & Drink',
  icon: 'gift',
  stock: 10,
}

const getRewardForm = (reward?: Reward | null): RewardDraftInput =>
  reward
    ? {
        name: reward.name,
        description: reward.description,
        cost: reward.cost,
        category: reward.category,
        icon: reward.icon,
        stock: reward.stock,
      }
    : emptyForm

export const RewardEditorModal = ({
  open,
  onClose,
  reward,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  reward?: Reward | null
  onSubmit: (input: RewardDraftInput) => void
}) => {
  const [form, setForm] = useState(() => getRewardForm(reward))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={reward ? 'Edit reward' : 'Create reward'}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Name
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Category
            <input
              required
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Description
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Cost
            <input
              type="number"
              min={10}
              value={form.cost}
              onChange={(event) => setForm((prev) => ({ ...prev, cost: Number(event.target.value) }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Icon
            <input
              value={form.icon}
              onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Stock
            <input
              type="number"
              min={0}
              value={form.stock ?? 0}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
              className="rounded-2xl border-slate-200"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{reward ? 'Save changes' : 'Create reward'}</Button>
        </div>
      </form>
    </Modal>
  )
}
