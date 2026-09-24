import { Plant } from '@phosphor-icons/react'
import EarthLinkBadge from '@/components/EarthLinkBadge'
import SoundToggle from '@/components/SoundToggle'
import { cn } from '@/lib/cn'
import type { EarthLink } from '@/types/spacefarm'

interface HeaderProps {
  connected: boolean
  updatedAt: string | null
  earthLink: EarthLink | null
  soundEnabled: boolean
  onToggleSound: () => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR')
}

function Header({ connected, updatedAt, earthLink, soundEnabled, onToggleSound }: HeaderProps) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-accent-soft text-accent">
            <Plant size={26} weight="regular" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight text-ink-900">SpaceFarm</h1>
            <p className="mt-1 text-sm text-ink-400">Serre connectée autonome</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
          <span className="flex items-center gap-2">
            <span className="relative flex size-2.5" aria-hidden>
              {connected && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              )}
              <span
                className={cn('relative inline-flex size-2.5 rounded-full', connected ? 'bg-accent' : 'bg-danger')}
              />
            </span>
            {connected ? 'Serveur connecté' : 'Serveur injoignable'}
          </span>
          {/*
            Hidden below `sm`: mixed with the flex-display badges next to it, this plain text span
            was the one item that kept the row from wrapping cleanly right when wrapping first
            becomes necessary. It is also the least essential item here (redundant with the live dot).
          */}
          {updatedAt && <span className="hidden font-mono text-ink-400 sm:inline">Maj {formatTime(updatedAt)}</span>}
          {earthLink && <EarthLinkBadge earthLink={earthLink} />}
          <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
        </div>
      </div>
    </header>
  )
}

export default Header
