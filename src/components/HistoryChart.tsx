import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatValue } from '@/lib/formatValue'
import { SENSOR_META } from '@/lib/sensors'
import type { HistoryPoint, SensorKey, ThresholdRange } from '@/types/spacefarm'

const ACCENT = '#0e7a4d'
const ACCENT_SOFT = '#bfe2cd'
const LINE_STRONG = '#8f9880'

interface HistoryChartProps {
  sensor: SensorKey
  points: HistoryPoint[]
  range: ThresholdRange
}

function formatTick(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const Y_TICK_COUNT = 6

/** Evenly spaced ticks across the scale, so the axis reads like a calibrated instrument rather than an auto-rounded guess. */
function evenTicks(min: number, max: number): number[] {
  return Array.from({ length: Y_TICK_COUNT }, (_, i) => Math.round(min + ((max - min) * i) / (Y_TICK_COUNT - 1)))
}

interface TooltipPayloadItem {
  value: number
  payload: HistoryPoint
}

function ChartTooltip({ active, payload, sensor }: { active?: boolean; payload?: TooltipPayloadItem[]; sensor: SensorKey }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-[0_4px_16px_rgba(18,21,15,0.12)]">
      <p className="font-mono text-xs text-ink-400">{formatTick(point.timestamp)}</p>
      <p className="font-mono font-medium text-ink-900">
        {formatValue(sensor, point.value)} {SENSOR_META[sensor].unit}
      </p>
    </div>
  )
}

/** Line chart for one sensor's history, with the allowed band drawn as dashed reference lines. */
function HistoryChart({ sensor, points, range }: HistoryChartProps) {
  const { scale } = SENSOR_META[sensor]

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="history-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={ACCENT_SOFT} />
            <stop offset="100%" stopColor={ACCENT} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e6dc" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTick}
          tick={{ fill: '#6b7360', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: '#e2e6dc' }}
          tickLine={false}
          interval={Math.max(0, Math.ceil(points.length / 6) - 1)}
          minTickGap={24}
        />
        <YAxis
          domain={[scale.min, scale.max]}
          ticks={evenTicks(scale.min, scale.max)}
          tick={{ fill: '#6b7360', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<ChartTooltip sensor={sensor} />} cursor={{ stroke: LINE_STRONG, strokeDasharray: '3 3' }} />
        {range.min !== null && (
          <ReferenceLine y={range.min} stroke={LINE_STRONG} strokeDasharray="4 4" ifOverflow="extendDomain" />
        )}
        {range.max !== null && (
          <ReferenceLine y={range.max} stroke={LINE_STRONG} strokeDasharray="4 4" ifOverflow="extendDomain" />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke="url(#history-line)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default HistoryChart
