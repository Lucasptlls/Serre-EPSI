import type {
  CrisisRequest,
  CrisisType,
  FanMode,
  FanState,
  FarmState,
  HistoryPoint,
  HistoryRange,
  SensorKey,
  ServerEvent,
  Thresholds,
} from '../types/spacefarm.ts'
import type { ApiClient } from './ApiClient.ts'

const EVENT_TYPES: readonly string[] = [
  'measure',
  'alert',
  'alert_cleared',
  'fan',
  'earth_link',
  'safe_mode',
  'crises',
]

const MAX_RETRY_DELAY_MS = 10_000

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function parseEvent(data: unknown): ServerEvent | null {
  if (typeof data !== 'string') return null
  try {
    const parsed: unknown = JSON.parse(data)
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      const { type } = parsed as { type: unknown }
      if (typeof type === 'string' && EVENT_TYPES.includes(type)) return parsed as ServerEvent
    }
  } catch {
    // Ignore malformed frames, the next one may be valid.
  }
  return null
}

/** baseUrl '' means same origin (e.g. behind a Vite proxy). */
export function createHttpClient(baseUrl: string): ApiClient {
  const base = baseUrl.replace(/\/+$/, '')

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
    if (!response.ok) {
      throw new ApiError(response.status, `Erreur ${response.status} sur ${path}`)
    }
    return (await response.json()) as T
  }

  function send<T>(method: 'PUT' | 'POST', path: string, body: unknown): Promise<T> {
    return request<T>(path, { method, body: JSON.stringify(body) })
  }

  function webSocketUrl(): string {
    if (base) return `${base.replace(/^http/, 'ws')}/ws`
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${scheme}://${window.location.host}/ws`
  }

  return {
    getState: () => request<FarmState>('/api/state'),

    getHistory: (sensor: SensorKey, range: HistoryRange) => {
      const query = new URLSearchParams({ sensor, range })
      return request<HistoryPoint[]>(`/api/history?${query.toString()}`)
    },

    getThresholds: () => request<Thresholds>('/api/thresholds'),

    putThresholds: (thresholds: Thresholds) => send<Thresholds>('PUT', '/api/thresholds', thresholds),

    setFan: (mode: FanMode) => send<FanState>('POST', '/api/fan', { mode }),

    triggerCrisis: (crisis: CrisisRequest) => send<CrisisType[]>('POST', '/api/crisis', crisis),

    subscribe: (onEvent, onConnectionChange) => {
      let socket: WebSocket | null = null
      let retryTimer: ReturnType<typeof setTimeout> | undefined
      let attempt = 0
      let closed = false

      const connect = () => {
        socket = new WebSocket(webSocketUrl())
        socket.onopen = () => {
          attempt = 0
          onConnectionChange?.(true)
        }
        socket.onmessage = (message: MessageEvent<unknown>) => {
          const event = parseEvent(message.data)
          if (event) onEvent(event)
        }
        socket.onclose = () => {
          if (closed) return
          onConnectionChange?.(false)
          const delay = Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS)
          attempt += 1
          retryTimer = setTimeout(connect, delay)
        }
      }

      connect()

      return () => {
        closed = true
        clearTimeout(retryTimer)
        socket?.close()
      }
    },
  }
}
