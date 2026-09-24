import { SENSOR_META } from './sensors'
import type { SensorKey, ThresholdRange } from '@/types/spacefarm'

export function formatValue(sensor: SensorKey, value: number): string {
  const { decimals } = SENSOR_META[sensor]
  return value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatRange(sensor: SensorKey, range: ThresholdRange): string {
  const { unit } = SENSOR_META[sensor]
  const { min, max } = range
  if (min !== null && max !== null) return `${formatValue(sensor, min)} à ${formatValue(sensor, max)} ${unit}`
  if (min !== null) return `min. ${formatValue(sensor, min)} ${unit}`
  if (max !== null) return `max. ${formatValue(sensor, max)} ${unit}`
  return 'Aucun seuil défini'
}
