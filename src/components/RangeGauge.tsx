import { cn } from '@/lib/cn'
import type { ThresholdRange } from '@/types/spacefarm'

interface RangeGaugeProps {
  label: string
  value: number | null
  range: ThresholdRange
  scale: { min: number; max: number }
  fillClassName: string
}

function toPercent(value: number, scale: { min: number; max: number }): number {
  const ratio = (value - scale.min) / (scale.max - scale.min)
  return Math.min(1, Math.max(0, ratio)) * 100
}

/** Bar filled up to the value. The allowed band is marked by two tick marks, like a measurement instrument. */
function RangeGauge({ label, value, range, scale, fillClassName }: RangeGaugeProps) {
  const bandStart = range.min === null ? null : toPercent(range.min, scale)
  const bandEnd = range.max === null ? null : toPercent(range.max, scale)
  const fill = value === null ? 0 : toPercent(value, scale) / 100

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={scale.min}
      aria-valuemax={scale.max}
      aria-valuenow={value ?? undefined}
      className="relative h-2.5 w-full rounded-full bg-surface-sunken"
    >
      <div className="absolute inset-x-0 inset-y-0.5 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full w-full origin-left rounded-full transition-transform duration-700 ease-out',
            fillClassName,
          )}
          style={{ transform: `scaleX(${fill})` }}
        />
      </div>
      {bandStart !== null && (
        <span
          aria-hidden
          className="absolute -top-1 h-[calc(100%+8px)] w-px bg-line-strong"
          style={{ left: `${bandStart}%` }}
        />
      )}
      {bandEnd !== null && (
        <span
          aria-hidden
          className="absolute -top-1 h-[calc(100%+8px)] w-px bg-line-strong"
          style={{ left: `${bandEnd}%` }}
        />
      )}
    </div>
  )
}

export default RangeGauge
