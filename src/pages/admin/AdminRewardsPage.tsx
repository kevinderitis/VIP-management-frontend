import { useState } from 'react'
import { Gift, Plus, Trash2, UserCog } from 'lucide-react'
import { RewardEditorModal } from '../../components/admin/RewardEditorModal'
import { Button } from '../../components/common/Button'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { Reward } from '../../types/models'
import { rewardIcons } from '../../utils/constants'

export const AdminRewardsPage = () => {
  const rewards = useAppStore((state) => state.rewards)
  const redemptions = useAppStore((state) => state.redemptions)
  const users = useAppStore((state) => state.users)
  const createReward = useAppStore((state) => state.createReward)
  const updateReward = useAppStore((state) => state.updateReward)
  const toggleReward = useAppStore((state) => state.toggleReward)
  const deleteReward = useAppStore((state) => state.deleteReward)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [openManageId, setOpenManageId] = useState<string | null>(null)

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
          <h3 className="section-title">Redemption history</h3>
          <div className="mt-5 grid gap-3">
            {redemptions.map((redemption) => {
              const volunteer = users.find((user) => user.id === redemption.volunteerId)
              const reward = rewards.find((item) => item.id === redemption.rewardId)
              return (
                <div key={redemption.id} className="rounded-[24px] bg-slate-50 p-4">
                  <p className="font-semibold text-ink">{reward?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {volunteer?.name} · {redemption.cost} pts
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Redeemed
                  </p>
                </div>
              )
            })}
          </div>
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
    </div>
  )
}
