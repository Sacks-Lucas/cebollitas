import { useIsFetching, useIsMutating } from '@tanstack/react-query'

/**
 * Thin indeterminate progress bar pinned to the top of the viewport, shown
 * whenever react-query has any in-flight fetch or mutation. Mount once in
 * Layout — every existing and future query/mutation gets covered automatically.
 *
 * The 150ms show-delay is handled via a CSS animation (`animate-progress-fade-in`)
 * rather than React state, so very quick responses never flash the bar.
 */
export function TopProgressBar() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const active = fetching + mutating > 0

  if (!active) return null

  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Cargando"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 animate-progress-fade-in overflow-hidden bg-argentina-celeste/20"
    >
      <div className="h-full w-1/3 animate-progress-slide bg-argentina-celeste" />
    </div>
  )
}
