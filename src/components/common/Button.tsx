import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'h-10 px-4 text-sm' : 'h-11 px-5 text-sm',
        variant === 'primary' &&
          'bg-ink text-white shadow-float hover:-translate-y-0.5 hover:bg-navy',
        variant === 'secondary' &&
          'border border-slate-200 bg-white text-ink hover:border-teal/40 hover:bg-mist',
        variant === 'ghost' && 'text-ink hover:bg-slate-100',
        variant === 'danger' && 'bg-danger text-white hover:bg-rose-600',
        className,
      )}
      {...props}
    />
  ),
)

Button.displayName = 'Button'
