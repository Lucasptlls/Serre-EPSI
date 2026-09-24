import { ChartLine } from '@phosphor-icons/react'
import { useState } from 'react'
import HistoryChart from '@/components/HistoryChart'
import TabPills from '@/components/TabPills'
import { useHistory } from '@/hooks/useHistory'
import { HISTORY_RANGES, SENSOR_KEYS, SENSOR_META } from '@/lib/sensors'
import type { HistoryRange, SensorKey, Thresholds } from '@/types/spacefarm'

const SENSOR_OPTIONS = SENSOR_KEYS.map((sensor) => ({ value: sensor, label: SENSOR_META[sensor].label }))

interface HistorySectionProps {
  thresholds: Thresholds | null
}

function HistorySection({ thresholds }: HistorySectionProps) {
  const [sensor, setSensor] = useState<SensorKey>('temperature')
  const [range, setRange] = useState<HistoryRange>('1h')
  const { points, loading, error } = useHistory(sensor, range)

  return (
    <section
      aria-label="Historique des mesures"
      className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(18,21,15,0.04),0_10px_24px_-16px_rgba(18,21,15,0.16)] sm:p-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-ink-600">
          <ChartLine size={22} weight="regular" aria-hidden />
          <h2 className="text-lg font-medium text-ink-900">Historique</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TabPills
            options={SENSOR_OPTIONS}
            value={sensor}
            onChange={setSensor}
            layoutId="history-sensor-pill"
            ariaLabel="Mesure affichée"
          />
          <TabPills
            options={HISTORY_RANGES}
            value={range}
            onChange={setRange}
            layoutId="history-range-pill"
            ariaLabel="Période affichée"
          />
        </div>
      </header>

      {error && <p className="text-sm text-danger-strong">{error}</p>}

      {loading && points.length === 0 ? (
        <div aria-hidden className="h-[260px] animate-pulse rounded-lg bg-surface-sunken" />
      ) : points.length === 0 ? (
        <p className="flex h-[260px] items-center justify-center text-sm text-ink-400">
          Aucune mesure sur cette période
        </p>
      ) : (
        <HistoryChart sensor={sensor} points={points} range={thresholds?.[sensor] ?? { min: null, max: null }} />
      )}
    </section>
  )
}

export default HistorySection
