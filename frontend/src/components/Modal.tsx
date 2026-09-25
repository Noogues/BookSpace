import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

export function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/50 p-3 backdrop-blur-md animate-fade-up sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`glass-strong relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 animate-pop sm:p-6`}
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-teal/70 to-transparent" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-stone-900/[0.05] hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-8 sm:w-8 dark:hover:bg-white/[0.07] dark:hover:text-stone-200"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}