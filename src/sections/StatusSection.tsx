import { motion } from 'framer-motion'
import CardSkeleton from '@/components/CardSkeleton'
import FanCard from '@/components/FanCard'
import SensorCard from '@/components/SensorCard'
import { staggerContainer } from '@/lib/motionVariants'
import type { FarmState, Thresholds } from '@/types/spacefarm'

interface StatusSectionProps {
  state: FarmState | null
  thresholds: Thresholds | null
}

function StatusSection({ state, thresholds }: StatusSectionProps) {
  if (!state || !thresholds) {
    return (
      <section aria-label="Chargement de l'état de la serre" className="grid gap-4 lg:grid-cols-12">
        <CardSkeleton className="min-h-80 lg:col-span-5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>
    )
  }

  const { measures, safeMode, fan } = state

  return (
    <motion.section
      aria-label="État de la serre"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:grid-cols-12"
    >
      <SensorCard
        sensor="temperature"
        value={measures.temperature}
        range={thresholds.temperature}
        noSignal={safeMode}
        size="lg"
        className="lg:col-span-5"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
        <SensorCard sensor="humidity" value={measures.humidity} range={thresholds.humidity} noSignal={safeMode} />
        <SensorCard
          sensor="luminosity"
          value={measures.luminosity}
          range={thresholds.luminosity}
          noSignal={safeMode}
        />
        <SensorCard
          sensor="soilMoisture"
          value={measures.soilMoisture}
          range={thresholds.soilMoisture}
          noSignal={safeMode}
        />
        <FanCard fan={fan} safeMode={safeMode} />
      </div>
    </motion.section>
  )
}

export default StatusSection
