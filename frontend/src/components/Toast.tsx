import { useCallback, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { ToastContext, type ToastKind } from './toast-context'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const ICONS: Record<ToastKind, { icon: typeof CheckCircle2; className: string; badge: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'text-emerald-500',
    badge: 'bg-emerald-500/15',
  },
  error: {
    icon: XCircle,
    className: 'text-red-500',
    badge: 'bg-red-500/15',
  },
  info: {
    icon: Info,
    className: 'text-sky-500',
    badge: 'bg-sky-500/15',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { id, kind, message }])
      window.setTimeout(() => remove(id), 4000)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
      >
{toasts.map((toast) => {
          const { icon: Icon, className, badge } = ICONS[toast.kind]
          return (
            <div
              key={toast.id}
              className="glass-strong pointer-events-auto flex items-start gap-3 px-4 py-3 shadow-xl animate-pop"
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${badge}`}>
                <Icon className={`h-4 w-4 ${className}`} />
              </span>
              <p className="flex-1 text-sm text-stone-700 dark:text-stone-200">{toast.message}</p>
              <button
                type="button"
                className="text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
                onClick={() => remove(toast.id)}
                aria-label="Close"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}