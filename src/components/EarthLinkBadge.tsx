import { CloudArrowUp, WifiHigh, WifiSlash } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import type { EarthLink } from '@/types/spacefarm'

interface EarthLinkBadgeProps {
  earthLink: EarthLink
  className?: string
}

/** Connection status with Earth: whether it's up, and how many messages are queued locally waiting to sync. */
function EarthLinkBadge({ earthLink, className }: EarthLinkBadgeProps) {
  const { connected, pendingMessages } = earthLink
  const Icon = connected ? WifiHigh : WifiSlash

  return (
    <span
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
        connected ? 'border-line-strong text-ink-600' : 'border-danger/40 bg-danger-soft text-danger-strong',
        className,
      )}
    >
      <Icon size={16} weight="regular" aria-hidden />
      Liaison spatiale {connected ? 'connectée' : 'coupée'}
      {pendingMessages > 0 && (
        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs',
            connected ? 'bg-accent-soft text-accent-strong' : 'bg-surface text-danger-strong',
          )}
        >
          <CloudArrowUp size={13} weight="bold" aria-hidden />
          {pendingMessages}
        </span>
      )}
    </span>
  )
}

export default EarthLinkBadge
