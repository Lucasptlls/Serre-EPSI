import { useEffect, useState } from 'react'
import { apiClient } from '@/api/createApiClient'
import type { HistoryPoint, HistoryRange, SensorKey } from '@/types/spacefarm'

const REFRESH_MS = 4000

export interface HistoryData {
  points: HistoryPoint[]
  loading: boolean
  error: string | null
}

interface Result {
  key: string
  points: HistoryPoint[]
}

/** Fetches the history of one sensor and keeps it fresh, refetching on an interval and whenever sensor/range change. */
export function useHistory(sensor: SensorKey, range: HistoryRange): HistoryData {
  const key = `${sensor}:${range}`
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const points = await apiClient.getHistory(sensor, range)
        if (cancelled) return
        setResult({ key, points })
        setError(null)
      } catch {
        if (cancelled) return
        setError('Historique indisponible')
      }
    }

    void load()
    const timer = setInterval(() => void load(), REFRESH_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [sensor, range, key])

  return { points: result?.key === key ? result.points : [], loading: result?.key !== key, error }
}
