import { useMemo } from 'react'
import { Gift } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { rewardIcons } from '../../utils/constants'

export const VolunteerRewardsPage = () => {
  const user = useSessionUser()
  const allRewards = useAppStore((state) => state.rewards)
  const redeemReward = useAppStore((state) => state.redeemReward)
  const rewards = useMemo(
    () => allRewards.filter((reward) => reward.isActive),
    [allRewards],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Rewards shop"
        title="Reward catalog"
        description="Rewards are redeemed instantly as long as you have enough points and stock is still available."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {rewards.map((reward) => {
          const Icon = rewardIcons[reward.icon as keyof typeof rewardIcons] ?? Gift
          const remainingStock = reward.stock
          const hasStock = remainingStock === undefined || remainingStock > 0
          const lowStock = remainingStock !== undefined && remainingStock > 0 && remainingStock <= 3
          const canRedeem = (user?.points ?? 0) >= reward.cost && hasStock

          return (
            <Panel key={reward.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-mist p-3 text-teal">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-ink">{reward.name}</h3>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {reward.cost} pts
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{reward.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{reward.category}</p>
                    {remainingStock !== undefined && remainingStock > 0 ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {remainingStock} left
                      </span>
                    ) : null}
                    {lowStock ? (
                      <span className="text-xs font-semibold text-rose-500">
                        Only a few left
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => user && redeemReward(reward.id, user.id)}
                disabled={!canRedeem}
                className="mt-5 w-full"
              >
                {canRedeem ? 'Redeem now' : hasStock ? 'More points needed' : 'Unavailable'}
              </Button>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
