import { Fan } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { riseIn } from '@/lib/motionVariants'
import type { FanState } from '@/types/spacefarm'

interface FanCardProps {
  fan: FanState
  /** Safe mode: the device is silent and ventilation is forced to its minimum. */
  safeMode: boolean
  className?: string
}

/** Read-only ventilation status, grouped with the other sensor cards. The command itself lives in the control sidebar. */
function FanCard({ fan, safeMode, className }: FanCardProps) {
  const modeLabel = fan.mode === 'auto' ? 'Automatique' : 'Manuel'

  return (
    <motion.article
      variants={riseIn}
      aria-label="Ventilateurs"
      className={cn(
        'flex h-full flex-col justify-between gap-6 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(18,21,15,0.04),0_10px_24px_-16px_rgba(18,21,15,0.16)]',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-ink-600">
          <Fan
            size={22}
            weight="regular"
            aria-hidden
            className={cn(fan.running && 'animate-spin text-accent [animation-duration:1.4s]')}
          />
          <h2 className="text-base font-medium">Ventilateurs</h2>
        </div>
        <span className="rounded-full border border-line-strong px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-ink-600">
          {modeLabel}
        </span>
      </header>

      <p
        className={cn(
          'text-4xl font-semibold leading-none tracking-tight',
          fan.running ? 'text-accent' : 'text-ink-900',
        )}
      >
        {fan.running ? 'En marche' : "À l'arrêt"}
      </p>

      <p className="text-sm text-ink-400">
        {safeMode
          ? 'Mode sûr : ventilation minimale forcée'
          : fan.mode === 'auto'
            ? 'Piloté par le seuil de température'
            : 'Commande manuelle active'}
      </p>
    </motion.article>
  )
}

export default FanCard
