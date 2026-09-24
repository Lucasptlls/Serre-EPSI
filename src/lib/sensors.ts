import type { SensorKey, Thresholds } from '../types/spacefarm.ts'

export interface SensorMeta {
  label: string
  unit: string
  decimals: number
  /** Display domain of the gauge, not a threshold. */
  scale: { min: number; max: number }
}

export const SENSOR_KEYS: readonly SensorKey[] = ['temperature', 'humidity', 'luminosity', 'soilMoisture']

export const SENSOR_META: Record<SensorKey, SensorMeta> = {
  temperature: { label: 'Température', unit: '°C', decimals: 1, scale: { min: 10, max: 35 } },
  humidity: { label: 'Humidité', unit: '%', decimals: 0, scale: { min: 0, max: 100 } },
  luminosity: { label: 'Luminosité', unit: 'lx', decimals: 0, scale: { min: 0, max: 8000 } },
  soilMoisture: { label: 'Humidité du sol', unit: '%', decimals: 0, scale: { min: 0, max: 100 } },
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  temperature: { min: 18, max: 24 },
  humidity: { min: 50, max: 70 },
  luminosity: { min: null, max: null },
  soilMoisture: { min: 30, max: null },
}

export const HISTORY_RANGES: readonly { value: import('@/types/spacefarm').HistoryRange; label: string }[] = [
  { value: '15m', label: '15 min' },
  { value: '1h', label: '1 h' },
  { value: '6h', label: '6 h' },
  { value: '24h', label: '24 h' },
]
