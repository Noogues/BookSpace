import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { createBook, listBooks, listTags, updateBook } from '../lib/api'
import type { Book, BookFilters, BookInput, FilterValues, PaginatedBooks, TagWithCount } from '../lib/types'
import { useAuth } from '../auth/auth-context'
import { BookCard } from '../components/BookCard'
import { BookForm } from '../components/BookForm'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { FilterControls } from '../components/FilterControls'
import { Modal } from '../components/Modal'
import { Pagination } from '../components/Pagination'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toast-context'

const PAGE_SIZE = 18
const EMPTY_FILTERS: FilterValues = { name: '', status: '', tags: [], sort: 'updated', order: 'desc' }

export function ShelfPage() {
  const { t } = useTranslation()
  const { push } = useToast()
  const { user } = useAuth()

  const [baseFilters, setBaseFilters] = useState<FilterValues>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedBooks | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [chaptersMenuOpen, setChaptersMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const name = searchParams.get('name') ?? ''
  const filters: FilterValues = useMemo(
    () => ({ ...baseFilters, name }),
    [baseFilters, name],
  )

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
    params.sort = filters.sort as BookFilters['sort']
    params.order = filters.order as BookFilters['order']
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

  const handleStatusChange = useCallback((status: string) => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setBaseFilters((current) => ({ ...current, status }))
    setPage(1)
  }, [])
  const handleTagChange = useCallback((tags: string[]) => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setBaseFilters((current) => ({ ...current, tags }))
    setPage(1)
  }, [])
  const handleSortChange = useCallback((sort: string) => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setBaseFilters((current) => ({ ...current, sort }))
    setPage(1)
  }, [])
  const handleOrderChange = useCallback((order: string) => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setBaseFilters((current) => ({ ...current, order }))
    setPage(1)
  }, [])
  const handleReset = useCallback(() => {
    setLoading(true)
    setData(null)
    setLoadError(false)
    setBaseFilters(EMPTY_FILTERS)
    setPage(1)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

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
      <div>
        <h1 className="page-title">{t('books.title')}</h1>
        <p className="page-subtitle">{t('books.shelfSubtitle')}</p>
      </div>

      <FilterControls
        filters={filters}
        tags={tags}
        onCreate={user ? () => setCreateOpen(true) : undefined}
        onStatusChange={handleStatusChange}
        onTagChange={handleTagChange}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
        onReset={handleReset}
      />

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : loadError ? (
        <ErrorState message={t('errors.loadBooks')} onRetry={handleRetry} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {data.items.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                disableHoverEffects={chaptersMenuOpen}
                onChaptersMenuOpenChange={setChaptersMenuOpen}
                onAdvance={
                  user
                    ? (target, amount) => void handleAdvance(target, amount)
                    : undefined
                }
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