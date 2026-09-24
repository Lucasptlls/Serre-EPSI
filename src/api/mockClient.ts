import { DEFAULT_THRESHOLDS, SENSOR_KEYS, SENSOR_META } from '../lib/sensors.ts'
import type {
  CrisisRequest,
  CrisisType,
  EarthLink,
  FanMode,
  FanState,
  FarmAlert,
  FarmState,
  HistoryPoint,
  HistoryRange,
  Measures,
  SensorKey,
  ServerEvent,
  Thresholds,
} from '../types/spacefarm.ts'
import type { ApiClient } from './ApiClient.ts'

export interface MockOptions {
  /** Simulation step, 2 s by default. */
  tickMs?: number
  /** Silence duration after which the device is declared mute. */
  silentAfterMs?: number
}

export type MockClient = ApiClient & { dispose(): void }

const BASELINE: Record<SensorKey, number> = {
  temperature: 21.5,
  humidity: 60,
  // Realistic for a small grow-light box (BH1750/photoresistor), not direct sunlight.
  luminosity: 3200,
  soilMoisture: 72,
}
const NOISE: Record<SensorKey, number> = { temperature: 0.15, humidity: 0.9, luminosity: 45, soilMoisture: 0.15 }
const SWING: Record<SensorKey, number> = { temperature: 1.2, humidity: 4, luminosity: 120, soilMoisture: 1.5 }

const OVERHEAT_TARGET = 29
const LOW_MOISTURE_TARGET = 12
const FAN_COOLING_RATE = 0.12
const FAN_COOLING_FLOOR = 20
const FAN_HYSTERESIS = 1
const MINUTE_MS = 60_000
const HISTORY_SEED_MINUTES = 24 * 60
const HISTORY_CAP = 4000
const HISTORY_MAX_POINTS = 240
const API_LATENCY_MS = 120

const RANGE_MS: Record<HistoryRange, number> = {
  '15m': 15 * MINUTE_MS,
  '1h': 60 * MINUTE_MS,
  '6h': 6 * 60 * MINUTE_MS,
  '24h': 24 * 60 * MINUTE_MS,
}

interface Listener {
  onEvent: (event: ServerEvent) => void
}

function jitter(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function latency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, API_LATENCY_MS))
}

function seedHistory(sensor: SensorKey): HistoryPoint[] {
  const now = Date.now()
  const points: HistoryPoint[] = []
  for (let i = HISTORY_SEED_MINUTES; i > 0; i -= 1) {
    const time = now - i * MINUTE_MS
    const wave = Math.sin(time / (3.5 * 60 * MINUTE_MS)) * SWING[sensor]
    points.push({
      timestamp: new Date(time).toISOString(),
      value: round(BASELINE[sensor] + wave + jitter(NOISE[sensor]), 2),
    })
  }
  return points
}

function downsample(points: HistoryPoint[]): HistoryPoint[] {
  if (points.length <= HISTORY_MAX_POINTS) return points
  const bucketSize = Math.ceil(points.length / HISTORY_MAX_POINTS)
  const result: HistoryPoint[] = []
  for (let start = 0; start < points.length; start += bucketSize) {
    const bucket = points.slice(start, start + bucketSize)
    const average = bucket.reduce((sum, point) => sum + point.value, 0) / bucket.length
    result.push({ timestamp: bucket[bucket.length - 1].timestamp, value: round(average, 2) })
  }
  return result
}

/**
 * Fake back-end: a small greenhouse simulation that starts ticking as soon as it is created.
 * Crises: overheat (temperature climbs, auto fan cools), earth_cut (messages pile up then resync),
 * sensor_mute (no more data, alert + safe mode), low_moisture (soil moisture drops below its minimum).
 */
export function createMockClient(options: MockOptions = {}): MockClient {
  const { tickMs = 2000, silentAfterMs = 8000 } = options

  const values: Record<SensorKey, number> = { ...BASELINE }
  const lastSeenMs: Record<SensorKey, number> = {
    temperature: Date.now(),
    humidity: Date.now(),
    luminosity: Date.now(),
    soilMoisture: Date.now(),
  }
  const history: Record<SensorKey, HistoryPoint[]> = {
    temperature: seedHistory('temperature'),
    humidity: seedHistory('humidity'),
    luminosity: seedHistory('luminosity'),
    soilMoisture: seedHistory('soilMoisture'),
  }

  let thresholds: Thresholds = structuredClone(DEFAULT_THRESHOLDS)
  let fan: FanState = { mode: 'auto', running: false }
  let earthLink: EarthLink = { connected: true, pendingMessages: 0 }
  let safeMode = false
  const crises = new Set<CrisisType>()
  const alerts = new Map<string, FarmAlert>()
  const listeners = new Set<Listener>()

  function emit(event: ServerEvent): void {
    listeners.forEach((listener) => listener.onEvent(event))
  }

  function nextValue(sensor: SensorKey): number {
    const current = values[sensor]
    let target = BASELINE[sensor]
    let pull = 0.1
    let cooling = 0

    if (sensor === 'temperature') {
      pull = 0.08
      if (crises.has('overheat')) target = OVERHEAT_TARGET
      if (fan.running) cooling = FAN_COOLING_RATE * (current - FAN_COOLING_FLOOR)
    }
    if (sensor === 'soilMoisture') {
      pull = 0.12
      if (crises.has('low_moisture')) target = LOW_MOISTURE_TARGET
    }

    const next = current + (target - current) * pull - cooling + jitter(NOISE[sensor])
    return sensor === 'luminosity' ? Math.max(0, next) : clamp(next, 0, 100)
  }

  function computeRunning(): boolean {
    // Safe mode forces minimal ventilation, whatever the selected mode.
    if (safeMode || fan.mode === 'on') return true
    if (fan.mode === 'off') return false
    const max = thresholds.temperature.max
    if (max === null) return false
    if (values.temperature > max) return true
    if (values.temperature < max - FAN_HYSTERESIS) return false
    return fan.running
  }

  function syncFan(): void {
    const running = computeRunning()
    if (running !== fan.running) {
      fan = { ...fan, running }
      emit({ type: 'fan', fan })
    }
  }

  function evaluateAlerts(): void {
    const desired = new Map<string, FarmAlert>()
    const raisedAt = new Date().toISOString()

    const add = (alert: Omit<FarmAlert, 'id' | 'raisedAt'>): void => {
      const id = `${alert.kind}:${alert.sensor}`
      desired.set(id, { ...alert, id, raisedAt })
    }

    SENSOR_KEYS.forEach((sensor) => {
      const { min, max } = thresholds[sensor]
      const value = round(values[sensor], SENSOR_META[sensor].decimals)
      if (max !== null && values[sensor] > max) {
        add({ kind: 'above_max', sensor, severity: 'warning', value, limit: max })
      }
      if (min !== null && values[sensor] < min) {
        const severity = sensor === 'soilMoisture' ? 'critical' : 'warning'
        add({ kind: 'below_min', sensor, severity, value, limit: min })
      }
    })
    if (safeMode) {
      add({ kind: 'sensor_silent', sensor: 'device', severity: 'critical', value: null, limit: null })
    }

    desired.forEach((alert, id) => {
      const known = alerts.get(id)
      if (!known) {
        alerts.set(id, alert)
        emit({ type: 'alert', alert })
      }
    })
    Array.from(alerts.keys()).forEach((id) => {
      if (!desired.has(id)) {
        alerts.delete(id)
        emit({ type: 'alert_cleared', id })
      }
    })
  }

  function updateEarthLink(accumulate: boolean, muted: boolean): void {
    const connected = !crises.has('earth_cut')
    let pendingMessages = earthLink.pendingMessages
    if (!connected) {
      if (accumulate && !muted) pendingMessages += SENSOR_KEYS.length
    } else if (pendingMessages > 0) {
      // Resync: the backlog drains over a few ticks.
      pendingMessages = Math.max(0, pendingMessages - Math.max(20, Math.ceil(pendingMessages / 3)))
    }
    if (connected !== earthLink.connected || pendingMessages !== earthLink.pendingMessages) {
      earthLink = { connected, pendingMessages }
      emit({ type: 'earth_link', earthLink })
    }
  }

  function tick(): void {
    const now = Date.now()
    const muted = crises.has('sensor_mute')

    if (!muted) {
      SENSOR_KEYS.forEach((sensor) => {
        values[sensor] = nextValue(sensor)
        lastSeenMs[sensor] = now
        const timestamp = new Date(now).toISOString()
        const value = round(values[sensor], 2)
        history[sensor].push({ timestamp, value })
        if (history[sensor].length > HISTORY_CAP) history[sensor].shift()
        emit({ type: 'measure', reading: { sensor, value, timestamp } })
      })
    }

    const silent = now - lastSeenMs.temperature > silentAfterMs
    if (silent !== safeMode) {
      safeMode = silent
      emit({ type: 'safe_mode', safeMode })
    }

    syncFan()
    evaluateAlerts()
    updateEarthLink(true, muted)
  }

  function snapshot(): FarmState {
    const measures = {} as Measures
    const lastSeen = {} as FarmState['lastSeen']
    SENSOR_KEYS.forEach((sensor) => {
      measures[sensor] = round(values[sensor], 2)
      lastSeen[sensor] = new Date(lastSeenMs[sensor]).toISOString()
    })
    return {
      measures,
      lastSeen,
      fan: { ...fan },
      alerts: Array.from(alerts.values()),
      earthLink: { ...earthLink },
      safeMode,
      activeCrises: Array.from(crises),
      updatedAt: new Date().toISOString(),
    }
  }

  const timer = setInterval(tick, tickMs)

  return {
    dispose: () => clearInterval(timer),

    async getState() {
      await latency()
      return snapshot()
    },

    async getHistory(sensor: SensorKey, range: HistoryRange) {
      await latency()
      const since = Date.now() - RANGE_MS[range]
      return downsample(history[sensor].filter((point) => Date.parse(point.timestamp) >= since))
    },

    async getThresholds() {
      await latency()
      return structuredClone(thresholds)
    },

    async putThresholds(next: Thresholds) {
      await latency()
      SENSOR_KEYS.forEach((sensor) => {
        const { min, max } = next[sensor]
        if (min !== null && max !== null && min > max) {
          throw new Error(`Seuils invalides pour ${SENSOR_META[sensor].label} : le minimum dépasse le maximum`)
        }
      })
      thresholds = structuredClone(next)
      syncFan()
      evaluateAlerts()
      return structuredClone(thresholds)
    },

    async setFan(mode: FanMode) {
      await latency()
      fan = { ...fan, mode }
      fan = { ...fan, running: computeRunning() }
      emit({ type: 'fan', fan })
      return { ...fan }
    },

    async triggerCrisis({ type, active }: CrisisRequest) {
      await latency()
      if (active) crises.add(type)
      else crises.delete(type)
      emit({ type: 'crises', activeCrises: Array.from(crises) })
      if (type === 'earth_cut') updateEarthLink(false, false)
      return Array.from(crises)
    },

    subscribe(onEvent, onConnectionChange) {
      const listener: Listener = { onEvent }
      listeners.add(listener)
      onConnectionChange?.(true)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
