import { useTranslation } from 'react-i18next'

const STYLES: Record<number, string> = {
  0: 'bg-stone-700/95 text-white dark:bg-stone-300 dark:text-stone-900',
  1: 'bg-teal-700 text-white shadow-teal-900/40 dark:bg-neon-teal dark:text-ink-950 dark:shadow-neon-teal/30',
  2: 'bg-emerald-700 text-white shadow-emerald-900/40 dark:bg-emerald-400 dark:text-emerald-950',
  3: 'bg-rose-700 text-white shadow-rose-900/40 dark:bg-rose-500 dark:text-rose-950',
}

export function StatusBadge({ status }: { status: number }) {
  const { t } = useTranslation()
  const style = STYLES[status] ?? STYLES[0]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  )
}