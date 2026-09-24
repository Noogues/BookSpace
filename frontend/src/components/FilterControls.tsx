import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RotateCcw, X } from 'lucide-react'
import type { FilterValues, TagWithCount } from '../lib/types'
import { PopMenu, PopMenuOption } from './PopMenu'

interface FilterControlsProps {
  filters: FilterValues
  tags: TagWithCount[]
  onCreate?: () => void
  onStatusChange: (status: string) => void
  onTagChange: (tags: string[]) => void
  onSortChange: (sort: string) => void
  onOrderChange: (order: string) => void
  onReset: () => void
}

const SORT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'updated', labelKey: 'books.filters.recent' },
  { value: 'added', labelKey: 'books.filters.added' },
  { value: 'name', labelKey: 'books.filters.name' },
]

const STATUS_VALUES = ['', '0', '1', '2', '3']

export function FilterControls({
  filters,
  tags,
  onCreate,
  onStatusChange,
  onTagChange,
  onSortChange,
  onOrderChange,
  onReset,
}: FilterControlsProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<'' | 'status' | 'sort' | 'tags'>('')

  const close = () => setOpen('')

  const statusLabel =
    filters.status === '' ? t('common.all') : t(`status.${filters.status}`)
  const sortLabel = t(
    (SORT_OPTIONS.find((option) => option.value === filters.sort) ?? SORT_OPTIONS[0]).labelKey,
  )

  const toggleTag = (name: string) => {
    onTagChange(
      filters.tags.includes(name)
        ? filters.tags.filter((item) => item !== name)
        : [...filters.tags, name],
    )
  }

  const hasActiveFilters =
    filters.status !== '' || filters.tags.length > 0 || filters.sort !== 'updated' || filters.order !== 'desc'

  return (
    <div className="glass relative z-20 flex flex-wrap items-center gap-x-1 gap-y-2 px-3 py-2 animate-fade-up">
      <PopMenu
        label={statusLabel}
        active={filters.status !== ''}
        open={open === 'status'}
        onOpenChange={(value) => setOpen(value ? 'status' : '')}
        widthClassName="w-56"
      >
        {STATUS_VALUES.map((value) => (
          <PopMenuOption
            key={value || 'all'}
            checked={filters.status === value}
            label={value === '' ? t('common.all') : t(`status.${value}`)}
            onSelect={() => {
              onStatusChange(filters.status === value ? '' : value)
              close()
            }}
          />
        ))}
      </PopMenu>

      <span className="hud-sep" aria-hidden="true" />

      <PopMenu
        label={sortLabel}
        active={filters.sort !== 'updated' || filters.order !== 'desc'}
        open={open === 'sort'}
        onOpenChange={(value) => setOpen(value ? 'sort' : '')}
        widthClassName="w-56"
      >
        {SORT_OPTIONS.map((option) => (
          <PopMenuOption
            key={option.value}
            checked={filters.sort === option.value}
            label={t(option.labelKey)}
            onSelect={() => {
              onSortChange(option.value)
              close()
            }}
          />
        ))}
        <div className="my-1 h-px bg-stone-200 dark:bg-white/10" aria-hidden="true" />
        <PopMenuOption
          checked={filters.order === 'asc'}
          label={t('books.filters.asc')}
          onSelect={() => {
            onOrderChange('asc')
            close()
          }}
        />
        <PopMenuOption
          checked={filters.order === 'desc'}
          label={t('books.filters.desc')}
          onSelect={() => {
            onOrderChange('desc')
            close()
          }}
        />
      </PopMenu>

      <span className="hud-sep" aria-hidden="true" />

      <PopMenu
        label={t('books.tags')}
        active={filters.tags.length > 0}
        badge={filters.tags.length}
        open={open === 'tags'}
        onOpenChange={(value) => setOpen(value ? 'tags' : '')}
      >
        {tags.length === 0 ? (
          <p className="px-2 py-3 text-sm text-stone-500 dark:text-stone-400">
            {t('books.filters.noTags')}
          </p>
        ) : (
          tags.map((item) => (
            <PopMenuOption
              key={item.id}
              role="menuitemcheckbox"
              checked={filters.tags.includes(item.name)}
              label={`#${item.name}`}
              count={item._count.books}
              onSelect={() => toggleTag(item.name)}
            />
          ))
        )}
      </PopMenu>

      {filters.tags.length > 0 ? (
        <>
          <span className="hud-sep" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.tags.map((name) => (
              <span key={name} className="hud-tag">
                #{name}
                <button
                  type="button"
                  className="rounded p-0.5 transition-colors hover:text-rose-500 dark:hover:text-rose-300"
                  onClick={() => toggleTag(name)}
                  aria-label={t('books.filters.removeFilter')}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        {hasActiveFilters ? (
          <button
            type="button"
            className="hud-btn text-rose-600 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
            onClick={onReset}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('books.filters.reset')}
          </button>
        ) : null}
        {onCreate ? (
          <button
            type="button"
            className="hud-btn hud-btn-active ml-1"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('books.new')}
          </button>
        ) : null}
      </div>
    </div>
  )
}