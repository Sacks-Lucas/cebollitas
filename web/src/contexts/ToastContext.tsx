import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 3500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'info' ? Info : XCircle
  const accent =
    toast.type === 'success'
      ? 'border-green-500/40 bg-green-600 text-white'
      : toast.type === 'info'
        ? 'border-argentina-celeste/40 bg-argentina-celesteDark text-white'
        : 'border-red-500/40 bg-red-600 text-white'

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-center gap-3 rounded-md border px-4 py-2.5 shadow-lg animate-toast-in ${accent}`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onDismiss}
        className="ml-1 rounded p-0.5 transition hover:bg-white/20"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
