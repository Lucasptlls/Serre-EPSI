import { motion } from 'framer-motion'
import RangeGauge from '@/components/RangeGauge'
import { cn } from '@/lib/cn'
import { formatRange, formatValue } from '@/lib/formatValue'
import { getSensorStatus, type SensorStatus } from '@/lib/getSensorStatus'
import { riseIn } from '@/lib/motionVariants'
import { SENSOR_ICON } from '@/lib/sensorIcons'
import { SENSOR_META } from '@/lib/sensors'
import type { SensorKey, ThresholdRange } from '@/types/spacefarm'

type CardStatus = SensorStatus | 'nosignal'

interface StatusStyle {
  label: string
  text: string
  bar: string
  fill: string
}

/** Each status gets a slim top indicator bar rather than a fully tinted card, like a status LED on an instrument panel. */
const STATUS_STYLE: Record<CardStatus, StatusStyle> = {
  ok: { label: 'Dans la plage', text: 'text-accent', bar: 'bg-accent', fill: 'bg-accent' },
  near: { label: 'Proche du seuil', text: 'text-warn-strong', bar: 'bg-warn', fill: 'bg-warn' },
  high: { label: 'Trop élevé', text: 'text-danger-strong', bar: 'bg-danger', fill: 'bg-danger' },
  low: { label: 'Trop bas', text: 'text-danger-strong', bar: 'bg-danger', fill: 'bg-danger' },
  none: { label: 'Sans seuil', text: 'text-ink-600', bar: 'bg-line-strong', fill: 'bg-ink-400' },
  nosignal: { label: 'Sans signal', text: 'text-ink-400', bar: 'bg-line-strong', fill: 'bg-ink-400' },
}

interface SensorCardProps {
  sensor: SensorKey
  value: number | null
  range: ThresholdRange
  /** True when the device is silent: the last value is stale. */
  noSignal: boolean
  size?: 'md' | 'lg'
  className?: string
}

function SensorCard({ sensor, value, range, noSignal, size = 'md', className }: SensorCardProps) {
  const meta = SENSOR_META[sensor]
  const SensorIcon = SENSOR_ICON[sensor]
  const scaleSpan = meta.scale.max - meta.scale.min
  const statusKey: CardStatus =
    noSignal || value === null ? 'nosignal' : getSensorStatus(value, range, scaleSpan)
  const status = STATUS_STYLE[statusKey]
  const isLarge = size === 'lg'

  return (
    <motion.article
      variants={riseIn}
      aria-label={meta.label}
      className={cn(
        'relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(18,21,15,0.04),0_10px_24px_-16px_rgba(18,21,15,0.16)] transition-opacity duration-500',
        isLarge && 'corner-ticks sm:p-8',
        statusKey === 'nosignal' && 'opacity-70',
        className,
      )}
    >
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-[3px]', status.bar)} />

      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-ink-600">
          <SensorIcon size={isLarge ? 26 : 22} weight="regular" aria-hidden />
          <h2 className={cn('font-medium', isLarge ? 'text-lg' : 'text-base')}>{meta.label}</h2>
        </div>
        <span className={cn('flex items-center gap-2 text-sm font-medium', status.text)}>
          <span className={cn('size-2 rounded-full', status.fill)} aria-hidden />
          {status.label}
        </span>
      </header>

      <p
        className={cn(
          'flex items-baseline gap-2 font-semibold leading-none tracking-tighter tabular-nums',
          isLarge ? 'text-7xl sm:text-8xl' : 'text-5xl',
          statusKey === 'nosignal' ? 'text-ink-400' : 'text-ink-900',
        )}
      >
        {value === null ? '--' : formatValue(sensor, value)}
        <span className={cn('font-medium text-ink-600', isLarge ? 'text-3xl' : 'text-xl')}>{meta.unit}</span>
      </p>

      <div className="flex flex-col gap-3">
        <RangeGauge
          label={meta.label}
          value={noSignal ? null : value}
          range={range}
          scale={meta.scale}
          fillClassName={status.fill}
        />
        <p className="text-sm text-ink-400">
          Plage attendue : <span className="font-mono text-ink-600">{formatRange(sensor, range)}</span>
        </p>
      </div>
    </motion.article>
  )
}

export default SensorCard
