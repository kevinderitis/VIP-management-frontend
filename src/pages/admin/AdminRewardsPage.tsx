import { useEffect, useMemo, useState } from 'react'
import { Gift, Plus, Trash2, UserCog } from 'lucide-react'
import { RewardEditorModal } from '../../components/admin/RewardEditorModal'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { Redemption, Reward } from '../../types/models'
import { rewardIcons } from '../../utils/constants'
import { formatDateTime } from '../../utils/format'

export const AdminRewardsPage = () => {
  const rewards = useAppStore((state) => state.rewards)
  const redemptions = useAppStore((state) => state.redemptions)
  const users = useAppStore((state) => state.users)
  const createReward = useAppStore((state) => state.createReward)
  const updateReward = useAppStore((state) => state.updateReward)
  const toggleReward = useAppStore((state) => state.toggleReward)
  const deleteReward = useAppStore((state) => state.deleteReward)
  const confirmRewardDelivered = useAppStore((state) => state.confirmRewardDelivered)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [openManageId, setOpenManageId] = useState<string | null>(null)
  const [historyVolunteerFilter, setHistoryVolunteerFilter] = useState('all')
  const [historyRewardFilter, setHistoryRewardFilter] = useState('all')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'delivered'>('all')
  const [historyPage, setHistoryPage] = useState(1)
  const historyPageSize = 8

  const volunteers = useMemo(
    () => users.filter((user) => user.role === 'volunteer').sort((left, right) => left.name.localeCompare(right.name)),
    [users],
  )

  const filteredRedemptions = useMemo(() => {
    return redemptions.filter((redemption) => {
      const volunteer = users.find((user) => user.id === redemption.volunteerId)
      const matchesVolunteer = historyVolunteerFilter === 'all' || volunteer?.name === historyVolunteerFilter
      const matchesReward = historyRewardFilter === 'all' || redemption.rewardId === historyRewardFilter
      const matchesStatus = historyStatusFilter === 'all' || redemption.status === historyStatusFilter

      return matchesVolunteer && matchesReward && matchesStatus
    })
  }, [historyRewardFilter, historyStatusFilter, historyVolunteerFilter, redemptions, users])

  useEffect(() => {
    setHistoryPage(1)
  }, [historyRewardFilter, historyStatusFilter, historyVolunteerFilter])

  const historyPages = Math.max(1, Math.ceil(filteredRedemptions.length / historyPageSize))
  const paginatedRedemptions = filteredRedemptions.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize,
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Rewards"
        title="Reward management"
        description="Redeemable catalog, stock tracking, and visibility over instant redemptions."
        action={
          <Button
            onClick={() => {
              setSelectedReward(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} className="mr-2" />
            Create reward
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {rewards.map((reward) => {
            const Icon = rewardIcons[reward.icon as keyof typeof rewardIcons] ?? Gift
            return (
              <Panel key={reward.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="rounded-2xl bg-mist p-3 text-teal">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-display text-xl font-semibold text-ink">{reward.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{reward.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">{reward.category}</span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{reward.cost} pts</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">Stock {reward.stock ?? '∞'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reward.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {reward.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-4 sm:hidden">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setOpenManageId(openManageId === reward.id ? null : reward.id)}
                  >
                    <UserCog size={15} className="mr-2" />
                    Manage
                  </Button>
                  {openManageId === reward.id ? (
                    <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedReward(reward)
                          setModalOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => toggleReward(reward.id)}>
                        {reward.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (!window.confirm(`Delete "${reward.name}" permanently?`)) return
                          void deleteReward(reward.id)
                        }}
                      >
                        <Trash2 size={15} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 hidden gap-2 sm:flex">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedReward(reward)
                      setModalOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleReward(reward.id)}>
                    {reward.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!window.confirm(`Delete "${reward.name}" permanently?`)) return
                      void deleteReward(reward.id)
                    }}
                  >
                    <Trash2 size={15} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </Panel>
            )
          })}
        </div>
        <Panel className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="section-title">Redemption history</h3>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {filteredRedemptions.length} result{filteredRedemptions.length === 1 ? '' : 's'} · Page {historyPage} of {historyPages}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-ink">
              Volunteer
              <select
                value={historyVolunteerFilter}
                onChange={(event) => setHistoryVolunteerFilter(event.target.value)}
                className="w-full min-w-0 rounded-2xl border-slate-200"
              >
                <option value="all">All volunteers</option>
                {volunteers.map((volunteer) => (
                  <option key={volunteer.id} value={volunteer.name}>
                    {volunteer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-ink">
              Reward
              <select
                value={historyRewardFilter}
                onChange={(event) => setHistoryRewardFilter(event.target.value)}
                className="w-full min-w-0 rounded-2xl border-slate-200"
              >
                <option value="all">All rewards</option>
                {rewards.map((reward) => (
                  <option key={reward.id} value={reward.id}>
                    {reward.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-ink">
              Delivery status
              <select
                value={historyStatusFilter}
                onChange={(event) => setHistoryStatusFilter(event.target.value as 'all' | 'completed' | 'delivered')}
                className="w-full min-w-0 rounded-2xl border-slate-200"
              >
                <option value="all">All statuses</option>
                <option value="completed">Pending delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </label>
          </div>
          <div className="mt-5 grid gap-3">
            {paginatedRedemptions.length ? (
              paginatedRedemptions.map((redemption) => {
                const volunteer = users.find((user) => user.id === redemption.volunteerId)
                const reward = rewards.find((item) => item.id === redemption.rewardId)
                return (
                  <div key={redemption.id} className="rounded-[24px] bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{reward?.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {volunteer?.name} · {redemption.cost} pts
                        </p>
                        <p className="mt-1 text-sm text-slate-500">Redeemed on {formatDateTime(redemption.createdAt)}</p>
                        {redemption.deliveredAt ? (
                          <p className="mt-1 text-sm text-slate-500">Delivered on {formatDateTime(redemption.deliveredAt)}</p>
                        ) : null}
                      </div>
                      {redemption.status !== 'delivered' ? (
                        <Button size="sm" variant="secondary" onClick={() => setSelectedRedemption(redemption)}>
                          Confirm delivery
                        </Button>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Delivered
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {redemption.status === 'delivered' ? 'Delivered' : 'Pending delivery'}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                No redemptions match these filters.
              </div>
            )}
          </div>
          {historyPages > 1 ? (
            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" variant="secondary" disabled={historyPage === 1} onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={historyPage === historyPages} onClick={() => setHistoryPage((current) => Math.min(historyPages, current + 1))}>
                Next
              </Button>
            </div>
          ) : null}
        </Panel>
      </div>
      <RewardEditorModal
        key={`${selectedReward?.id ?? 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        reward={selectedReward}
        onSubmit={(input) => {
          if (selectedReward) {
            updateReward(selectedReward.id, input)
            return
          }
          createReward(input)
        }}
      />
      <Modal
        open={Boolean(selectedRedemption)}
        onClose={() => setSelectedRedemption(null)}
        title="Confirm reward delivery"
        description="Use this only when the reward was actually handed over."
        panelClassName="max-w-lg"
      >
        <div className="grid gap-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-ink">
              {rewards.find((reward) => reward.id === selectedRedemption?.rewardId)?.name ?? 'Reward'}
            </p>
            <p className="mt-1">
              {users.find((user) => user.id === selectedRedemption?.volunteerId)?.name ?? 'Volunteer'} · {selectedRedemption?.cost ?? 0} pts
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedRedemption(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedRedemption) return
                void confirmRewardDelivered(selectedRedemption.id)
                setSelectedRedemption(null)
              }}
            >
              Confirm delivery
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
