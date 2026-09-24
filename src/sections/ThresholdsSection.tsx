import { CheckCircle, Sliders } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { SENSOR_ICON } from '@/lib/sensorIcons'
import { SENSOR_KEYS, SENSOR_META } from '@/lib/sensors'
import { draftToThresholds, parseRange, toDraft, type ThresholdsDraft } from '@/lib/thresholdDraft'
import type { SensorKey, Thresholds } from '@/types/spacefarm'

const SAVED_MESSAGE_MS = 2500

interface ThresholdsSectionProps {
  thresholds: Thresholds | null
  onSave: (next: Thresholds) => Promise<void>
}

function ThresholdsSection({ thresholds, onSave }: ThresholdsSectionProps) {
  const [draft, setDraft] = useState<ThresholdsDraft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  // Tracks the last `thresholds` reference the draft was built from, so a fresh load or a save
  // response resyncs the draft, while edits in progress (dirty) are never clobbered by a live push.
  const [syncedFrom, setSyncedFrom] = useState(thresholds)

  if (thresholds !== syncedFrom && !dirty) {
    setSyncedFrom(thresholds)
    setDraft(thresholds ? toDraft(thresholds) : null)
  }

  useEffect(() => {
    if (savedAt === null) return
    const timer = setTimeout(() => setSavedAt(null), SAVED_MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [savedAt])

  const setField = (sensor: SensorKey, field: 'min' | 'max', text: string) => {
    setDraft((previous) => (previous ? { ...previous, [sensor]: { ...previous[sensor], [field]: text } } : previous))
    setDirty(true)
    setError(null)
  }

  const cancel = () => {
    if (thresholds) setDraft(toDraft(thresholds))
    setDirty(false)
    setError(null)
  }

  const hasInvalidRow = draft ? SENSOR_KEYS.some((sensor) => !parseRange(draft[sensor]).valid) : true

  const save = async () => {
    if (!draft || hasInvalidRow) return
    setSaving(true)
    setError(null)
    try {
      await onSave(draftToThresholds(draft))
      setDirty(false)
      setSavedAt(Date.now())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      aria-label="Seuils des capteurs"
      className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(18,21,15,0.04),0_10px_24px_-16px_rgba(18,21,15,0.16)] sm:p-8"
    >
      <header className="flex items-center gap-2.5 text-ink-600">
        <Sliders size={22} weight="regular" aria-hidden />
        <div>
          <h2 className="text-lg font-medium text-ink-900">Seuils</h2>
          <p className="text-sm text-ink-400">Plage attendue par mesure, laisser vide pour ne pas en fixer</p>
        </div>
      </header>

      {draft ? (
        <div className="flex flex-col divide-y divide-line">
          {SENSOR_KEYS.map((sensor) => {
            const meta = SENSOR_META[sensor]
            const SensorIcon = SENSOR_ICON[sensor]
            const row = draft[sensor]
            const { valid } = parseRange(row)

            return (
              <div key={sensor} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex w-40 shrink-0 items-center gap-2 text-ink-900">
                    <SensorIcon size={18} weight="regular" aria-hidden className="text-ink-600" />
                    <span className="text-sm font-medium">{meta.label}</span>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-ink-400">
                    Min
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.min}
                      onChange={(event) => setField(sensor, 'min', event.target.value)}
                      placeholder="Aucun"
                      aria-invalid={!valid}
                      className={cn(
                        'h-9 w-24 rounded-lg border bg-surface px-2.5 font-mono text-sm text-ink-900 outline-none transition-colors focus:border-accent',
                        valid ? 'border-line-strong' : 'border-danger',
                      )}
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm text-ink-400">
                    Max
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.max}
                      onChange={(event) => setField(sensor, 'max', event.target.value)}
                      placeholder="Aucun"
                      aria-invalid={!valid}
                      className={cn(
                        'h-9 w-24 rounded-lg border bg-surface px-2.5 font-mono text-sm text-ink-900 outline-none transition-colors focus:border-accent',
                        valid ? 'border-line-strong' : 'border-danger',
                      )}
                    />
                  </label>

                  <span className="font-mono text-sm text-ink-400">{meta.unit}</span>
                </div>
                {!valid && <p className="text-xs text-danger-strong">Le minimum dépasse le maximum</p>}
              </div>
            )
          })}
        </div>
      ) : (
        <div aria-hidden className="h-48 animate-pulse rounded-lg bg-surface-sunken" />
      )}

      {error && <p className="text-sm text-danger-strong">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!draft || !dirty || hasInvalidRow || saving}
          onClick={() => void save()}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les seuils'}
        </button>
        {dirty && !saving && (
          <button
            type="button"
            onClick={cancel}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-ink-600 transition-colors duration-200 hover:bg-surface-sunken hover:text-ink-900"
          >
            Annuler
          </button>
        )}
        {savedAt !== null && (
          <span className="flex items-center gap-1.5 text-sm text-accent-strong">
            <CheckCircle size={16} weight="fill" aria-hidden />
            Seuils enregistrés
          </span>
        )}
      </div>
    </section>
  )
}

export default ThresholdsSection
