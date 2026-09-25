import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

function range(start: number, end: number): number[] {
  const result: number[] = []
  for (let i = start; i <= end; i += 1) result.push(i)
  return result
}

export function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const startPage = Math.max(1, page - 2)
  const endPage = Math.min(totalPages, page + 2)
  const pages = range(startPage, endPage)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  const pageButton = (pageNumber: number) => (
    <button
      key={pageNumber}
      type="button"
      className={`h-11 min-w-11 rounded-full px-2 text-sm font-medium transition-all duration-200 sm:h-9 sm:min-w-9 ${
        pageNumber === page
          ? 'bg-gradient-to-r from-teal-500 to-neon-sky text-white shadow-lg shadow-teal-500/30 dark:from-neon-indigo dark:to-neon-sky dark:text-ink-950 dark:shadow-neon-indigo/30'
          : 'text-stone-600 hover:bg-white/70 hover:shadow-md dark:text-stone-300 dark:hover:bg-white/[0.07]'
      }`}
      onClick={() => onPageChange(pageNumber)}
      aria-current={pageNumber === page ? 'page' : undefined}
    >
      {pageNumber}
    </button>
  )

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {t('books.pagination.showing', { from, to, total })}
      </p>
      <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1 sm:justify-center">
        <button
          type="button"
          className="btn-ghost h-11 w-11 px-0 sm:h-8 sm:w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {startPage > 1 ? (
          <>
            {pageButton(1)}
            {startPage > 2 ? <span className="px-1 text-stone-400">…</span> : null}
          </>
        ) : null}
        {pages.map(pageButton)}
        {endPage < totalPages ? (
          <>
            {endPage < totalPages - 1 ? <span className="px-1 text-stone-400">…</span> : null}
            {pageButton(totalPages)}
          </>
        ) : null}
        <button
          type="button"
          className="btn-ghost h-11 w-11 px-0 sm:h-8 sm:w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}