import { Fan } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import type { FanMode, FanState } from '@/types/spacefarm'

interface FanControlProps {
  fan: FanState
  onSetMode: (mode: FanMode) => Promise<void>
  className?: string
}

const MODE_OPTIONS: { mode: FanMode; label: string }[] = [
  { mode: 'auto', label: 'Auto' },
  { mode: 'on', label: 'Marche' },
  { mode: 'off', label: 'Arrêt' },
]

/** Ventilation command: lives in the control sidebar, separate from the read-only status shown on FanCard. */
function FanControl({ fan, onSetMode, className }: FanControlProps) {
  const [busy, setBusy] = useState(false)

  const handleSelect = async (mode: FanMode) => {
    if (busy || mode === fan.mode) return
    setBusy(true)
    await onSetMode(mode)
    setBusy(false)
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(18,21,15,0.04),0_10px_24px_-16px_rgba(18,21,15,0.16)]',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 text-ink-600">
        <Fan
          size={20}
          weight="regular"
          aria-hidden
          className={cn(fan.running && 'animate-spin text-accent [animation-duration:1.4s]')}
        />
        <h2 className="text-sm font-medium text-ink-900">Ventilateurs</h2>
      </div>

      <div
        role="radiogroup"
        aria-label="Mode des ventilateurs"
        className="relative grid grid-cols-3 gap-1 rounded-xl bg-surface-sunken p-1"
      >
        {MODE_OPTIONS.map(({ mode, label }) => {
          const selected = fan.mode === mode
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={busy}
              onClick={() => void handleSelect(mode)}
              className={cn(
                'relative h-10 cursor-pointer rounded-lg text-sm font-medium transition-colors duration-200 active:scale-[0.98] disabled:cursor-wait',
                selected ? 'text-accent-strong' : 'text-ink-400 hover:text-ink-600',
              )}
            >
              {selected && (
                <motion.span
                  layoutId="fan-mode-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-surface shadow-[0_1px_3px_rgba(18,21,15,0.12)]"
                />
              )}
              <span className="relative">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FanControl
