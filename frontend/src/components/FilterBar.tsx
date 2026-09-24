import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react'
import type { TagWithCount } from '../lib/types'

export interface FilterValues {
  name: string
  status: string
  tags: string[]
  sort: string
  order: string
}

interface FilterBarProps {
  filters: FilterValues
  tags: TagWithCount[]
  onNameChange: (name: string) => void
  onStatusChange: (status: string) => void
  onTagChange: (tags: string[]) => void
  onSortChange: (sort: string) => void
  onOrderChange: (order: string) => void
  onReset: () => void
}

const SORT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'updated', labelKey: 'books.filters.recentlyUpdated' },
  { value: 'added', labelKey: 'books.filters.dateAdded' },
  { value: 'name', labelKey: 'books.filters.name' },
]

export function FilterBar({
  filters,
  tags,
  onNameChange,
  onStatusChange,
  onTagChange,
  onSortChange,
  onOrderChange,
  onReset,
}: FilterBarProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(filters.name)

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (draft !== filters.name) onNameChange(draft)
    }, 350)
    return () => window.clearTimeout(id)
  }, [draft, filters.name, onNameChange])

  const hasFilters =
    filters.name !== '' || filters.status !== '' || filters.tags.length > 0 || filters.sort !== 'updated' || filters.order !== 'desc'

  const handleReset = () => {
    setDraft('')
    onReset()
  }

  return (
    <div className="glass flex flex-col gap-4 p-3.5 animate-fade-up">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400 dark:text-stone-500"
          aria-hidden="true"
        />
        <input
          type="search"
          className="input border-transparent py-3 pl-12 dark:border-transparent"
          placeholder={t('books.filters.namePlaceholder')}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={t('books.filters.namePlaceholder')}
        />
      </div>

      <div className="space-y-4">
        <div>
          <p className="filter-heading">{t('books.filters.sort')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={t('books.filters.sort')}>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSortChange(filters.sort === option.value ? 'updated' : option.value)}
                className={filters.sort === option.value ? 'chip chip-active' : 'chip'}
              >
                {t(option.labelKey)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onOrderChange(filters.order === 'desc' ? 'asc' : 'desc')}
              className="chip border-teal-400/40 text-teal-600 dark:text-neon-teal"
              aria-label={t(`books.filters.${filters.order}`)}
              title={t(`books.filters.${filters.order}`)}
            >
              {filters.order === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {t(`books.filters.${filters.order}`)}
            </button>
          </div>
        </div>

        <div>
          <p className="filter-heading">{t('books.filters.status')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={t('books.filters.status')}>
            <button
              type="button"
              onClick={() => onStatusChange('')}
              className={filters.status === '' ? 'chip chip-active' : 'chip'}
            >
              {t('common.all')}
            </button>
            {[0, 1, 2, 3].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onStatusChange(filters.status === String(value) ? '' : String(value))}
                className={filters.status === String(value) ? 'chip chip-active' : 'chip'}
              >
                {t(`status.${value}`)}
              </button>
            ))}
          </div>
        </div>

        {tags.length > 0 ? (
          <div>
            <p className="filter-heading">{t('books.filters.tag')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={t('books.filters.tag')}>
              {tags.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onTagChange(
                      filters.tags.includes(item.name)
                        ? filters.tags.filter((name) => name !== item.name)
                        : [...filters.tags, item.name],
                    )
                  }
                  className={filters.tags.includes(item.name) ? 'chip chip-active' : 'chip'}
                >
                  #{item.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {hasFilters ? (
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 transition-colors hover:text-rose-500 dark:text-stone-400 dark:hover:text-rose-300"
            onClick={handleReset}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {t('books.filters.reset')}
          </button>
        </div>
      ) : null}
    </div>
  )
}