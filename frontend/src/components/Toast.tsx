import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        className="pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 flex w-auto max-w-sm flex-col gap-2 sm:bottom-4 sm:left-auto sm:right-4 sm:w-80"
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
              <p className="min-w-0 flex-1 break-words text-sm text-stone-700 dark:text-stone-200">{toast.message}</p>
              <button
                type="button"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-8 sm:w-8 dark:hover:bg-white/5 dark:hover:text-stone-300"
                onClick={() => remove(toast.id)}
                aria-label={t('common.close')}
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