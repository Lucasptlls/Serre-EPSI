import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface TabPillsProps<T extends string> {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  layoutId: string
  ariaLabel: string
  className?: string
}

/** Segmented control: a row of pills with the selected one tracked by a sliding highlight. */
function TabPills<T extends string>({ options, value, onChange, layoutId, ariaLabel, className }: TabPillsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('relative inline-flex gap-1 rounded-xl bg-surface-sunken p-1', className)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative cursor-pointer whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200',
              selected ? 'text-accent-strong' : 'text-ink-400 hover:text-ink-600',
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-surface shadow-[0_1px_3px_rgba(18,21,15,0.12)]"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default TabPills
