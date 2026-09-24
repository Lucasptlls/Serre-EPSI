import { Drop, PottedPlant, Sun, Thermometer } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { SensorKey } from '@/types/spacefarm'

export const SENSOR_ICON: Record<SensorKey, Icon> = {
  temperature: Thermometer,
  humidity: Drop,
  luminosity: Sun,
  soilMoisture: PottedPlant,
}
