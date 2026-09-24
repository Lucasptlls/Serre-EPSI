import { ArrowCounterClockwise, Drop, Fire, Flask, Plugs, WifiSlash } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { CRISIS_META, CRISIS_TYPES } from '@/lib/crises'
import type { CrisisRequest, CrisisType } from '@/types/spacefarm'

const CRISIS_ICON: Record<CrisisType, Icon> = {
  overheat: Fire,
  earth_cut: WifiSlash,
  sensor_mute: Plugs,
  low_moisture: Drop,
}

// The sensor cut is set apart below: it takes the whole Raspberry Pi down, unlike the other three
// which stay local to one measure.
const GRID_CRISES = CRISIS_TYPES.filter((type) => type !== 'sensor_mute')
const SENSOR_MUTE_META = CRISIS_META.sensor_mute
const SensorMuteIcon = CRISIS_ICON.sensor_mute

interface CrisisConsoleProps {
  activeCrises: CrisisType[]
  onToggle: (request: CrisisRequest) => Promise<void>
  /**
   * True when rendered in the narrow control sidebar. Uses fixed single-column classes instead of
   * `sm:`/breakpoint utilities, which would fire on viewport width, not on this column's own width.
   */
  compact?: boolean
}

/** Demo tool: simulates incidents so the jury can watch the farm react. */
function CrisisConsole({ activeCrises, onToggle, compact = false }: CrisisConsoleProps) {
  const [busy, setBusy] = useState(false)
  const sensorMuted = activeCrises.includes('sensor_mute')

  const run = async (requests: CrisisRequest[]) => {
    if (busy) return
    setBusy(true)
    for (const request of requests) await onToggle(request)
    setBusy(false)
  }

  return (
    <section
      aria-label="Console de crise"
      className="flex flex-col gap-5 rounded-xl border border-dashed border-line-strong p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Flask size={22} weight="regular" aria-hidden className="text-ink-600" />
          <div>
            <h2 className="text-base font-medium text-ink-900">Console de crise</h2>
            <p className="text-sm text-ink-400">Démonstration : simule un incident sur la serre</p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy || activeCrises.length === 0}
          onClick={() => void run(activeCrises.map((type) => ({ type, active: false })))}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-ink-600 transition-colors duration-200 hover:border-ink-600 hover:bg-surface-sunken hover:text-ink-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowCounterClockwise size={18} weight="regular" aria-hidden />
          Tout réinitialiser
        </button>
      </header>

      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'sm:grid-cols-3')}>
        {GRID_CRISES.map((type) => {
          const { label, description } = CRISIS_META[type]
          const CrisisIcon = CRISIS_ICON[type]
          const active = activeCrises.includes(type)
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              disabled={busy}
              onClick={() => void run([{ type, active: !active }])}
              className={cn(
                'relative flex cursor-pointer flex-col items-start gap-3 overflow-hidden rounded-lg border p-4 text-left transition-colors duration-200 active:scale-[0.98] disabled:cursor-wait',
                active
                  ? 'border-danger/40 bg-danger-soft'
                  : 'border-line bg-surface hover:border-line-strong hover:bg-surface-sunken',
              )}
            >
              {active && <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-danger" />}
              <span className="flex w-full items-center justify-between gap-2">
                <CrisisIcon
                  size={24}
                  weight={active ? 'fill' : 'regular'}
                  aria-hidden
                  className={active ? 'text-danger' : 'text-ink-600'}
                />
                <span
                  className={cn(
                    'text-xs font-medium uppercase tracking-wider',
                    active ? 'text-danger-strong' : 'text-ink-400',
                  )}
                >
                  {active ? 'En cours' : 'Déclencher'}
                </span>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-base font-medium text-ink-900">{label}</span>
                <span className="text-sm text-ink-400">{description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 rounded-lg border-2 border-danger bg-danger-soft p-4',
          !compact && 'sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger text-white">
            <SensorMuteIcon size={20} weight="fill" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-danger-strong">Action critique</p>
            <p className="text-base font-medium text-ink-900">{SENSOR_MUTE_META.label}</p>
            <p className="text-sm text-ink-600">{SENSOR_MUTE_META.description}</p>
          </div>
        </div>
        <button
          type="button"
          aria-pressed={sensorMuted}
          disabled={busy}
          onClick={() => void run([{ type: 'sensor_mute', active: !sensorMuted }])}
          className={cn(
            'flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-colors duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60',
            sensorMuted ? 'bg-ink-900 hover:bg-ink-600' : 'bg-danger hover:bg-danger-strong',
            compact && 'w-full',
          )}
        >
          {sensorMuted ? 'Reconnecter les capteurs' : 'Déconnecter tous les capteurs'}
        </button>
      </div>
    </section>
  )
}

export default CrisisConsole
