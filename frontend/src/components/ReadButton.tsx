import type { ReactNode } from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ReadButtonProps {
  url: string
  className?: string
  iconOnly?: boolean
  children?: ReactNode
}

const FLOATING = 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-stone-950/45 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-linear-to-r hover:from-teal-500 hover:to-neon-sky hover:shadow-teal-500/40 sm:h-8 sm:w-8 dark:border-white/20 dark:bg-white/10 dark:hover:from-neon-teal dark:hover:to-neon-indigo dark:hover:text-ink-950'

export function ReadButton({ url, className = 'btn-link', iconOnly = false, children }: ReadButtonProps) {
  const { t } = useTranslation()
  const label = t('books.read')

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={iconOnly ? `${FLOATING} ${className}` : className}
    >
      {iconOnly ? (
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      ) : (
        <>
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {children ?? label}
          <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </>
      )}
    </a>
  )
}
