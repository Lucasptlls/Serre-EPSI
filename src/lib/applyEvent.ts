import type { FarmState, ServerEvent } from '../types/spacefarm.ts'

/** Pure reducer: applies a pushed WebSocket event to the current farm state. */
export function applyEvent(state: FarmState, event: ServerEvent): FarmState {
  switch (event.type) {
    case 'measure': {
      const { sensor, value, timestamp } = event.reading
      return {
        ...state,
        measures: { ...state.measures, [sensor]: value },
        lastSeen: { ...state.lastSeen, [sensor]: timestamp },
        updatedAt: timestamp,
      }
    }
    case 'alert': {
      const others = state.alerts.filter((alert) => alert.id !== event.alert.id)
      return { ...state, alerts: [...others, event.alert] }
    }
    case 'alert_cleared':
      return { ...state, alerts: state.alerts.filter((alert) => alert.id !== event.id) }
    case 'fan':
      return { ...state, fan: event.fan }
    case 'earth_link':
      return { ...state, earthLink: event.earthLink }
    case 'safe_mode':
      return { ...state, safeMode: event.safeMode }
    case 'crises':
      return { ...state, activeCrises: event.activeCrises }
  }
}
