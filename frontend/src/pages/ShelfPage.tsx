import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createBook, listBooks, listTags, updateBook } from '../lib/api'
import type { Book, BookFilters, BookInput, PaginatedBooks, TagWithCount } from '../lib/types'
import { BookCard } from '../components/BookCard'
import { BookForm } from '../components/BookForm'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { FilterBar, type FilterValues } from '../components/FilterBar'
import { Modal } from '../components/Modal'
import { Pagination } from '../components/Pagination'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toast-context'

const PAGE_SIZE = 18
const EMPTY_FILTERS: FilterValues = { name: '', status: '', tags: [] }

export function ShelfPage() {
  const { t } = useTranslation()
  const { push } = useToast()

  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedBooks | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true
    listTags()
      .then((result) => {
        if (active) setTags(result)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const loadBooks = useCallback(async () => {
    const params: BookFilters = { page, pageSize: PAGE_SIZE }
    if (filters.name) params.name = filters.name
    if (filters.status) params.status = Number(filters.status)
    if (filters.tags.length > 0) params.tag = filters.tags
    return listBooks(params)
  }, [filters, page])

  useEffect(() => {
    let active = true
    loadBooks()
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadBooks])

  const handleCreate = async (input: BookInput) => {
    setCreating(true)
    try {
      await createBook(input)
      setCreateOpen(false)
      push('success', t('toast.created'))
      setLoading(true)
      setData(null)
      setLoadError(false)
      const result = await loadBooks()
      setData(result)
    } catch {
      push('error', t('errors.unknown'))
    } finally {
      setLoading(false)
      setCreating(false)
    }
  }

  const handleNameChange = useCallback((name: string) => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setFilters((current) => ({ ...current, name }))
    setPage(1)
  }, [])
  const handleStatusChange = useCallback((status: string) => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setFilters((current) => ({ ...current, status }))
    setPage(1)
  }, [])
  const handleTagChange = useCallback((tags: string[]) => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setFilters((current) => ({ ...current, tags }))
    setPage(1)
  }, [])
  const handleReset = useCallback(() => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }, [])

  const handleRetry = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    setData(null)
    loadBooks()
      .then((result) => setData(result))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [loadBooks])

  const handleAdvance = async (book: Book, amount = 1) => {
    try {
      await updateBook(book.id, { lastChapter: book.lastChapter + amount })
      push('success', t('toast.advance', { book: book.name, count: amount }))
      const result = await loadBooks()
      if (loadError) setLoadError(false)
      setData(result)
    } catch {
      push('error', t('errors.unknown'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{t('books.title')}</h1>
          <p className="page-subtitle">{t('books.shelfSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('books.new')}
          </button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        tags={tags}
        onNameChange={handleNameChange}
        onStatusChange={handleStatusChange}
        onTagChange={handleTagChange}
        onReset={handleReset}
      />

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : loadError ? (
        <ErrorState message={t('errors.loadBooks')} onRetry={handleRetry} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {data.items.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAdvance={(target, amount) => void handleAdvance(target, amount)}
              />
            ))}
          </div>
          <Pagination
            page={page}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={(nextPage) => {
              setLoading(true)
              setData(null)
              setLoadError(false)
              setPage(nextPage)
            }}
          />
        </>
      ) : (
        <EmptyState message={t('books.empty')} />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('books.createTitle')}
        wide
      >
        <BookForm submitting={creating} onSubmit={(input) => void handleCreate(input)} />
      </Modal>
    </div>
  )
}