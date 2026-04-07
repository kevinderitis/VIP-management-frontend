import { ReactNode } from 'react'

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal">{eyebrow}</p> : null}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
    </div>
    {action}
  </div>
)
