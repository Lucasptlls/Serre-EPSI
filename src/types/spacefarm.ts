/** Shared types for the SpaceFarm API contract (to validate with the back). All dates are ISO 8601 strings. */

export type SensorKey = 'temperature' | 'humidity' | 'luminosity' | 'soilMoisture'

export type Measures = Record<SensorKey, number | null>

export interface Reading {
  sensor: SensorKey
  value: number
  timestamp: string
}

export type FanMode = 'auto' | 'on' | 'off'

export interface FanState {
  mode: FanMode
  running: boolean
}

export type AlertKind = 'above_max' | 'below_min' | 'sensor_silent'

/** 'device' = the Raspberry Pi itself (silent sensor), not a single measure. */
export type AlertSensor = SensorKey | 'device'

export type AlertSeverity = 'warning' | 'critical'

export interface FarmAlert {
  id: string
  kind: AlertKind
  sensor: AlertSensor
  severity: AlertSeverity
  raisedAt: string
  /** Measured value when the alert was raised (null for a silent device). */
  value: number | null
  /** Threshold that was crossed (null for a silent device). */
  limit: number | null
}

export interface EarthLink {
  connected: boolean
  /** Messages stored locally, waiting to be synchronised with Earth. */
  pendingMessages: number
}

export type CrisisType = 'overheat' | 'earth_cut' | 'sensor_mute' | 'low_moisture'

export interface FarmState {
  measures: Measures
  lastSeen: Record<SensorKey, string | null>
  fan: FanState
  alerts: FarmAlert[]
  earthLink: EarthLink
  /** True when the Raspberry Pi is silent and the farm falls back to minimal ventilation. */
  safeMode: boolean
  activeCrises: CrisisType[]
  updatedAt: string
}

export interface ThresholdRange {
  min: number | null
  max: number | null
}

export type Thresholds = Record<SensorKey, ThresholdRange>

export type HistoryRange = '15m' | '1h' | '6h' | '24h'

export interface HistoryPoint {
  timestamp: string
  value: number
}

export interface CrisisRequest {
  type: CrisisType
  active: boolean
}

/** Messages pushed by the WebSocket `/ws`. */
export type ServerEvent =
  | { type: 'measure'; reading: Reading }
  | { type: 'alert'; alert: FarmAlert }
  | { type: 'alert_cleared'; id: string }
  | { type: 'fan'; fan: FanState }
  | { type: 'earth_link'; earthLink: EarthLink }
  | { type: 'safe_mode'; safeMode: boolean }
  | { type: 'crises'; activeCrises: CrisisType[] }
