import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="glass flex flex-col items-center gap-3 px-6 py-16 text-center animate-fade-up">
      <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-neon-rose/15 text-rose-500 dark:text-rose-300">
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500 to-neon-rose opacity-10 blur-xl" />
        <TriangleAlert className="relative h-8 w-8" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm text-stone-600 dark:text-stone-300">{message}</p>
      {onRetry ? (
        <button type="button" className="btn-secondary mt-2" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  )
}