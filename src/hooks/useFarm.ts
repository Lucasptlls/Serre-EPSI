import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/api/createApiClient'
import { applyEvent } from '@/lib/applyEvent'
import type { CrisisRequest, FanMode, FarmState, ServerEvent, Thresholds } from '@/types/spacefarm'

const RETRY_DELAY_MS = 3000
const MAX_BUFFERED_EVENTS = 200

export interface FarmData {
  state: FarmState | null
  thresholds: Thresholds | null
  /** Live channel (WebSocket) status. */
  connected: boolean
  error: string | null
  /** Last failed command (fan, crisis), cleared by the next successful one. */
  actionError: string | null
  setFanMode: (mode: FanMode) => Promise<void>
  toggleCrisis: (request: CrisisRequest) => Promise<void>
  /** Throws with a French message on failure (invalid range, network), so the form can show it inline. */
  saveThresholds: (next: Thresholds) => Promise<void>
}

/** Loads the initial snapshot, then keeps it up to date with pushed events. */
export function useFarm(): FarmData {
  const [state, setState] = useState<FarmState | null>(null)
  const [thresholds, setThresholds] = useState<Thresholds | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const setFanMode = useCallback(async (mode: FanMode) => {
    try {
      const fan = await apiClient.setFan(mode)
      setState((previous) => (previous ? { ...previous, fan } : previous))
      setActionError(null)
    } catch {
      setActionError('Commande des ventilateurs impossible')
    }
  }, [])

  const toggleCrisis = useCallback(async (request: CrisisRequest) => {
    try {
      const activeCrises = await apiClient.triggerCrisis(request)
      setState((previous) => (previous ? { ...previous, activeCrises } : previous))
      setActionError(null)
    } catch {
      setActionError('Simulation de crise impossible')
    }
  }, [])

  const saveThresholds = useCallback(async (next: Thresholds) => {
    let saved: Thresholds
    try {
      saved = await apiClient.putThresholds(next)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Enregistrement des seuils impossible'
      throw new Error(message)
    }
    setThresholds(saved)
  }, [])

  useEffect(() => {
    let cancelled = false
    let loaded = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    // Events received while the snapshot is still loading are replayed on top of it.
    const buffered: ServerEvent[] = []

    const unsubscribe = apiClient.subscribe((event) => {
      if (!loaded) {
        buffered.push(event)
        if (buffered.length > MAX_BUFFERED_EVENTS) buffered.shift()
        return
      }
      setState((previous) => (previous ? applyEvent(previous, event) : previous))
    }, setConnected)

    const load = async () => {
      try {
        const [snapshot, limits] = await Promise.all([apiClient.getState(), apiClient.getThresholds()])
        if (cancelled) return
        setState(buffered.reduce<FarmState>((current, event) => applyEvent(current, event), snapshot))
        setThresholds(limits)
        buffered.length = 0
        loaded = true
        setError(null)
      } catch {
        if (cancelled) return
        setError('Serveur injoignable, nouvelle tentative en cours')
        retryTimer = setTimeout(load, RETRY_DELAY_MS)
      }
    }
    void load()

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      unsubscribe()
    }
  }, [])

  return { state, thresholds, connected, error, actionError, setFanMode, toggleCrisis, saveThresholds }
}
