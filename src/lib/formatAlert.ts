import { formatValue } from './formatValue'
import { SENSOR_META } from './sensors'
import type { FarmAlert, Measures } from '@/types/spacefarm'

export interface AlertText {
  title: string
  detail: string
}

/** Builds the French wording of an alert, using the live measure when available. */
export function formatAlert(alert: FarmAlert, measures: Measures): AlertText {
  const { sensor } = alert
  if (alert.kind === 'sensor_silent' || sensor === 'device') {
    return { title: 'Capteur muet', detail: 'Plus de données du Raspberry Pi, mode sûr activé' }
  }

  const { label, unit } = SENSOR_META[sensor]
  // All four measures are feminine nouns (température, humidité, luminosité, humidité du sol).
  const isHigh = alert.kind === 'above_max'
  const adjective = isHigh ? 'élevée' : 'basse'

  const value = measures[sensor] ?? alert.value
  const measured = value === null ? '--' : formatValue(sensor, value)
  const limit = alert.limit === null ? '' : `, ${isHigh ? 'maximum' : 'minimum'} ${formatValue(sensor, alert.limit)} ${unit}`

  return { title: `${label} trop ${adjective}`, detail: `${measured} ${unit}${limit}` }
}
