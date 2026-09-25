import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Tag as TagIcon, Trash2 } from 'lucide-react'
import { createTag, deleteTag, listTags } from '../lib/api'
import type { TagWithCount } from '../lib/types'
import { useAuth } from '../auth/auth-context'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toast-context'

export function TagsPage() {
  const { t } = useTranslation()
  const { push } = useToast()
  const { user } = useAuth()

  const [tags, setTags] = useState<TagWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deletingName, setDeletingName] = useState('')
  const [query, setQuery] = useState('')

  const loadTags = useCallback(async () => {
    return listTags()
  }, [])

  useEffect(() => {
    let active = true
    loadTags()
      .then((result) => {
        if (active) setTags(result)
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
  }, [loadTags])

  const fetchTags = useCallback(() => {
    setLoading(true)
    setError(false)
    setTags([])
    loadTags()
      .then((result) => setTags(result))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [loadTags])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    const value = name.trim()
    if (!value || creating) return
    setCreating(true)
    try {
      await createTag(value)
      setName('')
      push('success', t('toast.tagCreated'))
      fetchTags()
    } catch {
      push('error', t('errors.unknown'))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (deletingId === null) return
    try {
      await deleteTag(deletingId)
      setDeletingId(null)
      push('success', t('toast.tagDeleted'))
      fetchTags()
    } catch {
      setDeletingId(null)
      push('error', t('errors.unknown'))
    }
  }

  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('tags.title')}</h1>
        <p className="page-subtitle">{t('app.tagline')}</p>
      </div>

      {user ? (
        <form onSubmit={handleCreate} className="glass flex flex-col gap-2 p-4 sm:flex-row sm:items-center animate-fade-up">
          <div className="relative flex-1">
            <TagIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-neon-indigo/70"
              aria-hidden="true"
            />
            <input
              className="input pl-10"
              placeholder={t('tags.placeholder')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label={t('tags.placeholder')}
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full shrink-0 sm:w-auto"
            disabled={creating || !name.trim()}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('tags.new')}
          </button>
        </form>
      ) : null}

      {tags.length > 0 ? (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500"
            aria-hidden="true"
          />
          <input
            type="search"
            className="input pl-10"
            placeholder={t('tags.searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t('tags.searchPlaceholder')}
          />
        </div>
      ) : null}

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : error ? (
        <ErrorState message={t('errors.loadTags')} onRetry={fetchTags} />
      ) : tags.length === 0 ? (
        <EmptyState message={t('tags.empty')} icon={TagIcon} />
      ) : filteredTags.length === 0 ? (
        <EmptyState message={t('tags.noResults', { query })} icon={TagIcon} />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {filteredTags.map((tag) => (
            <li
              key={tag.id}
              className="glass group flex max-w-full items-center gap-2 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-neon-indigo/50 hover:shadow-xl hover:shadow-neon-indigo/10 dark:hover:border-neon-indigo/50"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-linear-to-br from-teal-500/20 to-neon-sky/20 text-teal-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 dark:from-neon-indigo/20 dark:to-neon-sky/20 dark:text-neon-teal">
                <TagIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                {tag.name}
              </span>
              <span className="chip shrink-0">{t('tags.booksCount', { count: tag._count.books })}</span>
              {user ? (
                <button
                  type="button"
                  className="ml-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-rose-500/10 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:h-7 sm:w-7 dark:hover:text-rose-300"
                  onClick={() => {
                    setDeletingId(tag.id)
                    setDeletingName(tag.name)
                  }}
                  aria-label={`${t('common.delete')} ${tag.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title={t('tags.deleteTitle')}
        message={t('tags.deleteMessage', { name: deletingName })}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}