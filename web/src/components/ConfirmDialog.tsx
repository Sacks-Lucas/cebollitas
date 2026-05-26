import { createPortal } from 'react-dom'

import { es } from '../i18n/es'
import { Spinner } from './Spinner'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  pendingLabel?: string
  isPending?: boolean
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Generic confirmation modal for destructive actions. Matches the portal +
 * backdrop pattern used by the other modals in the app and supports a pending
 * spinner while the underlying mutation runs.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = es.confirm,
  cancelLabel = es.cancel,
  pendingLabel,
  isPending = false,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmButtonClass = danger
    ? 'flex min-w-[6rem] items-center justify-center gap-2 rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70'
    : 'flex min-w-[6rem] items-center justify-center gap-2 rounded bg-argentina-celeste px-3 py-1 text-white transition hover:bg-argentina-celesteDark disabled:cursor-not-allowed disabled:opacity-70'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={isPending ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-5 shadow-2xl dark:bg-argentina-navy"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-argentina-navyDeep dark:text-argentina-celeste/90">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded border border-argentina-celeste/60 px-3 py-1 text-argentina-celesteDark transition hover:bg-argentina-celeste/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-argentina-celeste dark:hover:bg-argentina-celeste/20"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={isPending} className={confirmButtonClass}>
            {isPending ? <Spinner size={14} label={pendingLabel ?? confirmLabel} /> : null}
            {isPending && pendingLabel ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
