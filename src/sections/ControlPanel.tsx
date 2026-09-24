import FanControl from '@/components/FanControl'
import CrisisConsole from '@/sections/CrisisConsole'
import type { CrisisRequest, CrisisType, FanMode, FanState } from '@/types/spacefarm'

interface ControlPanelProps {
  fan: FanState
  onSetFanMode: (mode: FanMode) => Promise<void>
  activeCrises: CrisisType[]
  onToggleCrisis: (request: CrisisRequest) => Promise<void>
  /** True in the narrow sidebar; false when stacked full-width below the status cards. */
  compact?: boolean
}

/**
 * Everything that acts on the farm rather than just showing it: fan command and crisis simulation.
 * Rendered twice by the page (see App.tsx) so it can sit inline on narrow screens and pinned in a
 * sidebar on wide ones, without fighting Tailwind's viewport-based breakpoints inside a fixed-width column.
 */
function ControlPanel({ fan, onSetFanMode, activeCrises, onToggleCrisis, compact = false }: ControlPanelProps) {
  return (
    <>
      <FanControl fan={fan} onSetMode={onSetFanMode} />
      <CrisisConsole activeCrises={activeCrises} onToggle={onToggleCrisis} compact={compact} />
    </>
  )
}

export default ControlPanel
