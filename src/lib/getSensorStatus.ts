import type { ThresholdRange } from '@/types/spacefarm'

export type SensorStatus = 'ok' | 'near' | 'high' | 'low' | 'none'

const NEAR_BAND_RATIO = 0.1
const NEAR_SCALE_RATIO = 0.05

/**
 * Compares a measure to its thresholds. "near" = still in range but within 10 % of the band
 * width from a bound (5 % of the display scale when only one bound is set).
 */
export function getSensorStatus(value: number, range: ThresholdRange, scaleSpan: number): SensorStatus {
  const { min, max } = range
  if (min === null && max === null) return 'none'
  if (max !== null && value > max) return 'high'
  if (min !== null && value < min) return 'low'

  const margin = min !== null && max !== null ? (max - min) * NEAR_BAND_RATIO : scaleSpan * NEAR_SCALE_RATIO
  const nearMax = max !== null && value > max - margin
  const nearMin = min !== null && value < min + margin
  return nearMax || nearMin ? 'near' : 'ok'
}
