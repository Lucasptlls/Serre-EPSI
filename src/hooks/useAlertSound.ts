import { useCallback, useEffect, useRef, useState } from 'react'
import { playSound } from '@/lib/playSound'
import type { FarmAlert } from '@/types/spacefarm'

const REPEAT_INTERVAL_MS = 10_000

export interface AlertSound {
  enabled: boolean
  toggle: () => void
}

/**
 * Plays an alarm when a new alert appears, then every 10 s while alerts remain.
 * Browsers block audio until a user gesture, so it stays off until `toggle` is called from a click.
 */
export function useAlertSound(alerts: FarmAlert[]): AlertSound {
  const [enabled, setEnabled] = useState(false)
  const contextRef = useRef<AudioContext | null>(null)
  const knownIdsRef = useRef<Set<string>>(new Set())

  const idsKey = alerts
    .map((alert) => alert.id)
    .sort()
    .join('|')
  const hasAlerts = alerts.length > 0

  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false)
      return
    }
    const context = contextRef.current ?? new AudioContext()
    contextRef.current = context
    void context.resume()
    playSound(context, 'confirm')
    setEnabled(true)
  }, [enabled])

  // New alert ids trigger the alarm; ids are tracked even while muted so enabling stays quiet.
  useEffect(() => {
    const ids = idsKey === '' ? [] : idsKey.split('|')
    const hasNew = ids.some((id) => !knownIdsRef.current.has(id))
    knownIdsRef.current = new Set(ids)
    const context = contextRef.current
    if (enabled && context && hasNew) playSound(context, 'alarm')
  }, [idsKey, enabled])

  useEffect(() => {
    const context = contextRef.current
    if (!enabled || !hasAlerts || !context) return
    const timer = setInterval(() => playSound(context, 'alarm'), REPEAT_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [enabled, hasAlerts])

  useEffect(
    () => () => {
      void contextRef.current?.close()
    },
    [],
  )

  return { enabled, toggle }
}
