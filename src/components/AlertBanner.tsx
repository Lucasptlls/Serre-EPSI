import { WarningOctagon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import SoundToggle from '@/components/SoundToggle'
import { formatAlert } from '@/lib/formatAlert'
import type { FarmAlert, Measures } from '@/types/spacefarm'

interface AlertBannerProps {
  alerts: FarmAlert[]
  measures: Measures
  soundEnabled: boolean
  onToggleSound: () => void
}

function sortAlerts(alerts: FarmAlert[]): FarmAlert[] {
  return [...alerts].sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1
    return a.raisedAt.localeCompare(b.raisedAt)
  })
}

function AlertBanner({ alerts, measures, soundEnabled, onToggleSound }: AlertBannerProps) {
  return (
    <AnimatePresence initial={false}>
      {alerts.length > 0 && (
        <motion.section
          key="alert-banner"
          aria-label="Alertes actives"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="flex flex-col gap-4 rounded-xl border border-danger/40 bg-danger-soft p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"
        >
          <div className="flex items-start gap-4">
            <WarningOctagon size={32} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-danger" />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-danger-strong">
                {alerts.length === 1 ? 'Alerte active' : `${alerts.length} alertes actives`}
              </h2>
              <ul role="alert" aria-atomic="false" className="flex flex-col gap-1.5">
                {sortAlerts(alerts).map((alert) => {
                  const { title, detail } = formatAlert(alert, measures)
                  return (
                    <li key={alert.id} className="flex flex-wrap items-baseline gap-x-3 text-base">
                      <span className="font-medium text-ink-900">{title}</span>
                      <span aria-hidden className="font-mono text-sm text-danger-strong">
                        {detail}
                      </span>
                      <span className="font-mono text-xs text-ink-400">
                        depuis {new Date(alert.raisedAt).toLocaleTimeString('fr-FR')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          {!soundEnabled && <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} className="shrink-0" />}
        </motion.section>
      )}
    </AnimatePresence>
  )
}

export default AlertBanner
