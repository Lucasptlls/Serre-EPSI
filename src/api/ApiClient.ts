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

export interface ApiClient {
  /** GET /api/state */
  getState(): Promise<FarmState>
  /** GET /api/history?sensor=&range= */
  getHistory(sensor: SensorKey, range: HistoryRange): Promise<HistoryPoint[]>
  /** GET /api/thresholds */
  getThresholds(): Promise<Thresholds>
  /** PUT /api/thresholds */
  putThresholds(thresholds: Thresholds): Promise<Thresholds>
  /** POST /api/fan */
  setFan(mode: FanMode): Promise<FanState>
  /** POST /api/crisis. Resolves with the list of crises still active. */
  triggerCrisis(request: CrisisRequest): Promise<CrisisType[]>
  /** WebSocket /ws. Returns an unsubscribe function. */
  subscribe(
    onEvent: (event: ServerEvent) => void,
    onConnectionChange?: (connected: boolean) => void,
  ): () => void
}
