import { Loader2 } from 'lucide-react'

import { es } from '../i18n/es'

type SpinnerProps = {
  size?: number
  label?: string
  className?: string
}

/**
 * Inline spinner — drop into buttons, list items, etc.
 * Hidden label is read by screen readers.
 */
export function Spinner({ size = 16, label = es.loading, className }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`} role="status">
      <Loader2 size={size} className="animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

type PageSpinnerProps = {
  label?: string
  className?: string
}

/**
 * Section-level spinner — vertically padded so it sits comfortably inside a
 * page section or modal body. Pair with `isLoading` from a top-level query.
 */
export function PageSpinner({ label = es.loading, className }: PageSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-16 text-argentina-celesteDark dark:text-argentina-celeste ${
        className ?? ''
      }`}
    >
      <Loader2 size={36} className="animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
