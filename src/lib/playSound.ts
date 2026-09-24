export type SoundKind = 'alarm' | 'confirm'

interface Beep {
  frequency: number
  start: number
  duration: number
}

const PEAK_GAIN = 0.18
const ATTACK_S = 0.02

const BEEPS: Record<SoundKind, Beep[]> = {
  alarm: [
    { frequency: 880, start: 0, duration: 0.18 },
    { frequency: 660, start: 0.26, duration: 0.18 },
    { frequency: 880, start: 0.52, duration: 0.18 },
  ],
  confirm: [{ frequency: 660, start: 0, duration: 0.14 }],
}

/** Short synthesised beeps (no audio asset needed, works offline). */
export function playSound(context: AudioContext, kind: SoundKind): void {
  const now = context.currentTime
  BEEPS[kind].forEach(({ frequency, start, duration }) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    // Ramp in and out to avoid clicks.
    gain.gain.setValueAtTime(0, now + start)
    gain.gain.linearRampToValueAtTime(PEAK_GAIN, now + start + ATTACK_S)
    gain.gain.linearRampToValueAtTime(0, now + start + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now + start)
    oscillator.stop(now + start + duration + ATTACK_S)
  })
}
