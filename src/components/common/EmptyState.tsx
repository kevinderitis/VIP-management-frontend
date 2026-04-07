import { ReactNode } from 'react'
import { Panel } from './Panel'

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) => (
  <Panel className="rounded-[28px] border-dashed p-8 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-teal">{icon}</div>
    <h3 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </Panel>
)
