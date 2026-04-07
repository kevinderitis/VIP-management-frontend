import { ReactNode } from 'react'
import { Panel } from './Panel'

export const StatCard = ({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string | number
  hint: string
  icon: ReactNode
}) => (
  <Panel className="rounded-[24px] p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      </div>
      <div className="rounded-2xl bg-mist p-3 text-teal">{icon}</div>
    </div>
  </Panel>
)
