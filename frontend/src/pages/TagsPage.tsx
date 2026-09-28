import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { GitMerge, Pencil, Plus, Search, Tag as TagIcon, Trash2, X } from 'lucide-react'
import { createTag, deleteTag, errorStatus, listTags, mergeTags, renameTag } from '../lib/api'
import type { TagWithCount } from '../lib/types'
import { useAuth } from '../auth/auth-context'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Modal } from '../components/Modal'
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [mergingFrom, setMergingFrom] = useState<TagWithCount | null>(null)
  const [merging, setMerging] = useState(false)

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

  const startRename = (tag: TagWithCount) => {
    setEditingId(tag.id)
    setEditingName(tag.name)
  }

  const handleRename = async (event: FormEvent) => {
    event.preventDefault()
    if (editingId === null) return
    const value = editingName.trim()
    if (!value || renaming) return
    setRenaming(true)
    try {
      await renameTag(editingId, value)
      setEditingId(null)
      push('success', t('toast.tagRenamed'))
      fetchTags()
    } catch (error) {
      if (errorStatus(error) === 409) push('error', t('tags.renameExists'))
      else push('error', t('errors.unknown'))
    } finally {
      setRenaming(false)
    }
  }

  const handleMerge = async (targetId: number) => {
    if (!mergingFrom || merging) return
    setMerging(true)
    try {
      await mergeTags(mergingFrom.id, targetId)
      setMergingFrom(null)
      push('success', t('toast.tagsMerged'))
      fetchTags()
    } catch {
      push('error', t('errors.unknown'))
    } finally {
      setMerging(false)
    }
  }

  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(query.trim().toLowerCase()))
  const mergeCandidates = mergingFrom
    ? tags
        .filter((tag) => tag.id !== mergingFrom.id)
        .sort((a, b) => b._count.books - a._count.books || a.name.localeCompare(b.name))
    : []

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

              {editingId === tag.id ? (
                <form onSubmit={handleRename} className="flex min-w-0 items-center gap-1">
                  <input
                    autoFocus
                    className="input h-8 w-36 py-1 text-sm"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setEditingId(null)
                    }}
                    aria-label={t('tags.renameTitle', { name: tag.name })}
                  />
                  <button
                    type="submit"
                    className="btn-primary h-8 shrink-0 px-2.5 py-1 text-xs"
                    disabled={renaming || !editingName.trim()}
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary h-8 shrink-0 px-2 py-1"
                    onClick={() => setEditingId(null)}
                    aria-label={t('common.cancel')}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                    {tag.name}
                  </span>
                  <span className="chip shrink-0">{t('tags.booksCount', { count: tag._count.books })}</span>
                  {user ? (
                    <>
                      <button
                        type="button"
                        className="ml-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-teal-500/10 hover:text-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-7 sm:w-7 dark:hover:text-neon-teal"
                        onClick={() => startRename(tag)}
                        aria-label={t('tags.renameTitle', { name: tag.name })}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      {tags.length > 1 ? (
                        <button
                          type="button"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-neon-indigo/10 hover:text-neon-indigo focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:h-7 sm:w-7 dark:hover:text-neon-indigo"
                          onClick={() => setMergingFrom(tag)}
                          aria-label={t('tags.mergeTitle', { name: tag.name })}
                        >
                          <GitMerge className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-rose-500/10 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:h-7 sm:w-7 dark:hover:text-rose-300"
                        onClick={() => {
                          setDeletingId(tag.id)
                          setDeletingName(tag.name)
                        }}
                        aria-label={`${t('common.delete')} ${tag.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                </>
              )}
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

      <Modal
        open={mergingFrom !== null}
        onClose={() => setMergingFrom(null)}
        title={t('tags.mergeTitle', { name: mergingFrom?.name ?? '' })}
      >
        <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
          {t('tags.mergeMessage')}
        </p>
        {mergeCandidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
            {t('tags.mergeNoTargets')}
          </p>
        ) : (
          <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
            {mergeCandidates.map((target) => (
              <li key={target.id}>
                <button
                  type="button"
                  disabled={merging}
                  onClick={() => void handleMerge(target.id)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-teal-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 dark:hover:bg-white/5"
                >
                  <TagIcon className="h-4 w-4 shrink-0 text-teal-600 dark:text-neon-teal" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                    #{target.name}
                  </span>
                  <span className="chip shrink-0">
                    {t('tags.booksCount', { count: target._count.books })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}