import { SENSOR_KEYS } from './sensors'
import type { SensorKey, Thresholds } from '@/types/spacefarm'

export interface DraftRange {
  min: string
  max: string
}

export type ThresholdsDraft = Record<SensorKey, DraftRange>

export function toDraft(thresholds: Thresholds): ThresholdsDraft {
  const draft = {} as ThresholdsDraft
  SENSOR_KEYS.forEach((sensor) => {
    const { min, max } = thresholds[sensor]
    draft[sensor] = { min: min === null ? '' : String(min), max: max === null ? '' : String(max) }
  })
  return draft
}

export interface ParsedRange {
  /** null when the field is empty (no threshold), NaN when the text does not parse as a number. */
  min: number | null
  max: number | null
  /** True once both bounds parse and min stays at or below max. */
  valid: boolean
}

function parseField(text: string): number | null {
  const trimmed = text.trim()
  return trimmed === '' ? null : Number(trimmed)
}

export function parseRange(draft: DraftRange): ParsedRange {
  const min = parseField(draft.min)
  const max = parseField(draft.max)
  const minOk = min === null || !Number.isNaN(min)
  const maxOk = max === null || !Number.isNaN(max)
  const orderOk = min === null || max === null || Number.isNaN(min) || Number.isNaN(max) || min <= max
  return { min, max, valid: minOk && maxOk && orderOk }
}

export function draftToThresholds(draft: ThresholdsDraft): Thresholds {
  const thresholds = {} as Thresholds
  SENSOR_KEYS.forEach((sensor) => {
    const { min, max } = parseRange(draft[sensor])
    thresholds[sensor] = { min, max }
  })
  return thresholds
}
