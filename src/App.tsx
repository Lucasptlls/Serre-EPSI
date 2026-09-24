import { MotionConfig } from 'framer-motion'
import { lazy, Suspense } from 'react'
import AlertBanner from '@/components/AlertBanner'
import Header from '@/components/Header'
import { useAlertSound } from '@/hooks/useAlertSound'
import { useFarm } from '@/hooks/useFarm'
import ControlPanel from '@/sections/ControlPanel'
import StatusSection from '@/sections/StatusSection'
import ThresholdsSection from '@/sections/ThresholdsSection'

// Recharts is heavy: split it out of the main bundle, it is only needed once the dashboard is up.
const HistorySection = lazy(() => import('@/sections/HistorySection'))

function App() {
  const { state, thresholds, connected, error, actionError, setFanMode, toggleCrisis, saveThresholds } = useFarm()
  const alerts = state?.alerts ?? []
  const sound = useAlertSound(alerts)

  return (
    <MotionConfig reducedMotion="user">
      <Header
        connected={connected}
        updatedAt={state?.updatedAt ?? null}
        earthLink={state?.earthLink ?? null}
        soundEnabled={sound.enabled}
        onToggleSound={sound.toggle}
      />
      {/*
        Below `xl` the page is one column: status, then the control panel (fan + crises), then the
        rest, so the demo tools stay reachable without a long scroll. At `xl` and above the control
        panel moves into a sticky sidebar instead, staying in view the whole time.
      */}
      {/* No `items-start` here on purpose: the default `stretch` makes the aside track match the main
          column's height, which is what gives its sticky child room to roam as the page scrolls. */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 pb-16 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {(error ?? actionError) && (
            <p role="status" className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn-strong">
              {error ?? actionError}
            </p>
          )}
          {state && (
            <AlertBanner
              alerts={alerts}
              measures={state.measures}
              soundEnabled={sound.enabled}
              onToggleSound={sound.toggle}
            />
          )}
          <StatusSection state={state} thresholds={thresholds} />
          <div className="flex flex-col gap-6 xl:hidden">
            {state && (
              <ControlPanel
                fan={state.fan}
                onSetFanMode={setFanMode}
                activeCrises={state.activeCrises}
                onToggleCrisis={toggleCrisis}
              />
            )}
          </div>
          <ThresholdsSection thresholds={thresholds} onSave={saveThresholds} />
          <Suspense fallback={<div aria-hidden className="h-[420px] animate-pulse rounded-xl bg-surface-sunken" />}>
            <HistorySection thresholds={thresholds} />
          </Suspense>
        </div>

        <aside aria-label="Commandes" className="hidden xl:block">
          <div className="flex flex-col gap-6 xl:sticky xl:top-6">
            {state && (
              <ControlPanel
                fan={state.fan}
                onSetFanMode={setFanMode}
                activeCrises={state.activeCrises}
                onToggleCrisis={toggleCrisis}
                compact
              />
            )}
          </div>
        </aside>
      </main>
    </MotionConfig>
  )
}

export default App
