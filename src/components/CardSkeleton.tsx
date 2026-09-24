import { cn } from '@/lib/cn'

interface CardSkeletonProps {
  className?: string
}

/** Loading placeholder with the same footprint as a status card. */
function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex h-full min-h-44 animate-pulse flex-col justify-between gap-6 rounded-xl border border-line bg-surface p-6',
        className,
      )}
    >
      <div className="h-4 w-1/3 rounded bg-surface-sunken" />
      <div className="h-10 w-1/2 rounded bg-surface-sunken" />
      <div className="h-3 w-full rounded-full bg-surface-sunken" />
    </div>
  )
}

export default CardSkeleton
