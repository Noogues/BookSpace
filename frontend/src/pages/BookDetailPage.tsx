import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import i18n from '../i18n'
import { deleteBook, getBook, updateBook } from '../lib/api'
import type { Book, BookInput } from '../lib/types'
import { useAuth } from '../auth/auth-context'
import { formatDate, formatRating, resolveCoverPath } from '../lib/format'
import { BookForm } from '../components/BookForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState } from '../components/ErrorState'
import { Modal } from '../components/Modal'
import { Spinner } from '../components/Spinner'
import { StatusBadge } from '../components/StatusBadge'
import { useToast } from '../components/toast-context'

function Cover({ coverPath, name }: { coverPath: string | null; name: string }) {
  const { t } = useTranslation()
  const [broken, setBroken] = useState(false)

  if (!coverPath || broken) {
    return (
      <div className="flex aspect-[2/3] w-full items-center justify-center bg-gradient-to-br from-teal-100 via-paper-100 to-neon-indigo/15 text-sm text-stone-400 dark:from-ink-700 dark:via-ink-800 dark:to-ink-900 dark:text-stone-500">
        {t('common.none')}
      </div>
    )
  }

  return (
    <img
      src={resolveCoverPath(coverPath)}
      alt={name}
      className="aspect-[2/3] w-full rounded-xl object-cover shadow-2xl shadow-stone-900/20"
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setBroken(true)}
    />
  )
}

export function BookDetailPage() {
  const { t } = useTranslation()
  const { push } = useToast()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const bookId = Number(id)

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isInteger(bookId)) return null
    return getBook(bookId)
  }, [bookId])

  useEffect(() => {
    let active = true
    load()
      .then((result) => {
        if (active) {
          if (result) setBook(result)
          else setError(true)
        }
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
  }, [load])

  const handleSave = async (input: BookInput) => {
    setSaving(true)
    try {
      const updated = await updateBook(bookId, input)
      setBook(updated)
      setEditOpen(false)
      push('success', t('toast.saved'))
    } catch {
      push('error', t('errors.unknown'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteBook(bookId)
      setDeleteOpen(false)
      push('success', t('toast.deleted'))
      navigate('/')
    } catch {
      setDeleteOpen(false)
      push('error', t('errors.unknown'))
    } finally {
      setDeleting(false)
    }
  }

  const handleRetry = useCallback(() => {
    setLoading(true)
    setBook(null)
    setError(false)
    getBook(bookId)
      .then((result) => setBook(result))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [bookId])

  if (loading) return <Spinner label={t('common.loading')} />
  if (error || !book) {
    return <ErrorState message={t('errors.loadBook')} onRetry={handleRetry} />
  }

  return (
    <div className="space-y-4">
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('common.back')}
      </button>

      <div className="glass relative overflow-hidden animate-fade-up">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-teal/60 to-transparent" />
        <div className="grid gap-6 p-6 sm:grid-cols-[220px_1fr]">
          <div>
            <Cover coverPath={book.coverPath} name={book.name} />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="page-title">{book.name}</h1>
                {book.secundaryName ? (
                  <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                    {book.secundaryName}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={book.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="font-medium text-stone-500 dark:text-stone-400">
                  {t('books.lastChapter')}
                </dt>
                <dd className="mt-0.5 inline-block rounded-lg bg-gradient-to-r from-teal-500/10 to-neon-sky/10 px-2.5 py-1 text-lg font-semibold text-stone-900 dark:from-neon-teal/15 dark:to-neon-rose/15 dark:text-white">
                  {book.lastChapter}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-stone-500 dark:text-stone-400">
                  {t('books.rating')}
                </dt>
                <dd className="mt-0.5 inline-block rounded-lg bg-gradient-to-r from-teal-500/10 to-neon-sky/10 px-2.5 py-1 text-lg font-semibold text-stone-900 dark:from-neon-teal/15 dark:to-neon-rose/15 dark:text-white">
                  {book.rating > 0 ? `★ ${formatRating(book.rating)}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-stone-500 dark:text-stone-400">
                  {t('books.url')}
                </dt>
                <dd className="mt-0.5">
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-600 hover:underline dark:text-teal-400"
                  >
                    {book.url.length > 40 ? `${book.url.slice(0, 40)}…` : book.url}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-stone-500 dark:text-stone-400">
                  {t('books.completedAt')}
                </dt>
                <dd className="mt-0.5">{formatDate(book.completedAt, i18n.resolvedLanguage ?? 'es')}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-500 dark:text-stone-400">
                  {t('books.createdAt')}
                </dt>
                <dd className="mt-0.5">{formatDate(book.createdAt, i18n.resolvedLanguage ?? 'es')}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-500 dark:text-stone-400">
                  {t('books.updatedAt')}
                </dt>
                <dd className="mt-0.5">{formatDate(book.updateAt, i18n.resolvedLanguage ?? 'es')}</dd>
              </div>
            </dl>

            {book.tags.length > 0 ? (
              <div>
                <dt className="text-sm font-medium text-stone-500 dark:text-stone-400">
                  {t('books.tags')}
                </dt>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {book.tags.map(({ tag }) => (
                    <span key={tag.id} className="chip">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              {user ? (
                <>
                  <button type="button" className="btn-secondary" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    {t('common.edit')}
                  </button>
                  <button type="button" className="btn-danger" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t('common.delete')}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('books.editTitle')} wide>
        <BookForm initial={book} submitting={saving} onSubmit={(input) => void handleSave(input)} />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title={t('books.deleteTitle')}
        message={t('books.deleteMessage', { name: book.name })}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}