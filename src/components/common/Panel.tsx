import { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export const Panel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('surface-panel', className)} {...props} />
)
