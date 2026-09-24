import type { CrisisType } from '@/types/spacefarm'

export interface CrisisMeta {
  label: string
  description: string
}

export const CRISIS_TYPES: readonly CrisisType[] = ['overheat', 'earth_cut', 'sensor_mute', 'low_moisture']

export const CRISIS_META: Record<CrisisType, CrisisMeta> = {
  overheat: { label: 'Surchauffe', description: 'La serre chauffe, les ventilateurs doivent réagir' },
  earth_cut: { label: 'Coupure liaison spatiale', description: 'Signal coupé, les messages sont mis en attente' },
  sensor_mute: { label: 'Capteur muet', description: 'Plus aucune donnée du Raspberry Pi' },
  low_moisture: { label: 'Sol trop sec', description: "L'humidité du sol descend sous le minimum" },
}
