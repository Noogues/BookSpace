import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, BookOpen, Star, Tag as TagIcon, TrendingUp } from 'lucide-react'
import { getStats } from '../lib/api'
import { formatRating } from '../lib/format'
import type { LibraryStats } from '../lib/types'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'

const STATUS_BARS = [
  'bg-stone-500 dark:bg-stone-400',
  'bg-teal-600 dark:bg-neon-teal',
  'bg-emerald-600 dark:bg-emerald-400',
  'bg-rose-600 dark:bg-rose-400',
] as const

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="glass flex items-center gap-4 p-4 animate-fade-up">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500/20 to-neon-indigo/20 text-teal-700 dark:text-neon-teal">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">
          {label}
        </p>
        <p className="truncate text-2xl font-semibold text-stone-900 dark:text-white">{value}</p>
        {hint ? <p className="truncate text-xs text-stone-400 dark:text-stone-500">{hint}</p> : null}
      </div>
    </div>
  )
}

function Bar({ percent, tone }: { percent: number; tone: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/70 dark:bg-white/10">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${tone}`}
        style={{ width: `${Math.max(percent, 1.5)}%` }}
      />
    </div>
  )
}

export function AnalyticsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    return getStats()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let active = true
    getStats()
      .then((result) => {
        if (active) setStats(result)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) return <Spinner label={t('common.loading')} />
  if (error || !stats) {
    return <ErrorState message={t('errors.loadStats')} onRetry={() => void load()} />
  }
  if (stats.totalBooks === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t('analytics.title')}</h1>
          <p className="page-subtitle">{t('analytics.subtitle')}</p>
        </div>
        <EmptyState message={t('analytics.noBooks')} icon={BarChart3} />
      </div>
    )
  }

  const maxStatus = Math.max(...stats.byStatus.map((row) => row.count), 1)
  const maxTag = Math.max(...stats.topTags.map((tag) => tag.count), 1)
  const year = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('analytics.title')}</h1>
        <p className="page-subtitle">{t('analytics.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
          label={t('analytics.totalBooks')}
          value={t('books.number', { count: stats.totalBooks })}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          label={t('analytics.totalChapters')}
          value={t('analytics.chapters', { count: stats.totalChapters })}
        />
        <StatCard
          icon={<Star className="h-5 w-5" aria-hidden="true" />}
          label={t('analytics.avgRating')}
          value={stats.ratedBooks > 0 ? formatRating(stats.averageRating) : '—'}
          hint={
            stats.ratedBooks > 0
              ? t('analytics.ratedBooks', { count: stats.ratedBooks })
              : t('analytics.noRatings')
          }
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
          label={`${year}`}
          value={t('analytics.completedThisYear', { count: stats.completedThisYear })}
          hint={t('analytics.addedThisYear', { count: stats.addedThisYear })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass p-5 animate-fade-up">
          <h2 className="mb-4 text-sm font-semibold text-stone-800 dark:text-stone-100">
            {t('analytics.byStatus')}
          </h2>
          <ul className="space-y-3">
            {stats.byStatus.map((row) => (
              <li key={row.status} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-stone-700 dark:text-stone-200">
                    {t(`status.${row.status}`)}
                  </span>
                  <span className="shrink-0 tabular-nums text-stone-500 dark:text-stone-400">
                    {row.count}
                    <span className="ml-1 text-xs text-stone-400 dark:text-stone-500">
                      ({t('analytics.percent', { count: Math.round((row.count / stats.totalBooks) * 100) })})
                    </span>
                  </span>
                </div>
                <Bar percent={(row.count / maxStatus) * 100} tone={STATUS_BARS[row.status] ?? STATUS_BARS[0]} />
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-5 animate-fade-up">
          <h2 className="mb-4 text-sm font-semibold text-stone-800 dark:text-stone-100">
            {t('analytics.topTags')}
          </h2>
          {stats.topTags.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
              {t('analytics.noTags')}
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.topTags.map((tag) => (
                <li key={tag.name} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-stone-700 dark:text-stone-200">
                      #{tag.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-stone-500 dark:text-stone-400">
                      {tag.count}
                    </span>
                  </div>
                  <Bar
                    percent={(tag.count / maxTag) * 100}
                    tone="bg-linear-to-r from-teal-500 to-neon-sky dark:from-neon-indigo dark:to-neon-sky"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {stats.topTags.length === 0 ? (
        <p className="flex items-center justify-center gap-2 text-xs text-stone-400 dark:text-stone-500">
          <TagIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('analytics.tagHint')}
        </p>
      ) : null}
    </div>
  )
}
