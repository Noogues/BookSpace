import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dices } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Book } from '../lib/types'
import { formatRating } from '../lib/format'
import { CoverImage } from './CoverImage'
import { Modal } from './Modal'
import { RandomBookReel } from './RandomBookReel'
import { ReadButton } from './ReadButton'
import { StatusBadge } from './StatusBadge'

interface RandomPickModalProps {
  book: Book | null
  candidates: Book[]
  rollId: number
  onClose: () => void
  onPickAgain: () => void
  picking: boolean
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function Placeholder() {
  return <div className="aspect-[2/3] w-full rounded-xl bg-linear-to-br from-stone-200 to-stone-300 dark:from-ink-700 dark:to-ink-800" />
}

export function RandomPickModal({ book, candidates, rollId, onClose, onPickAgain, picking }: RandomPickModalProps) {
  const { t } = useTranslation()
  const [landedFor, setLandedFor] = useState<number | null>(null)

  const landed = landedFor === rollId
  const handleLanded = useCallback(() => {
    setLandedFor(rollId)
  }, [rollId])

  const open = picking || book !== null
  const roll = book !== null && candidates.length > 0 && !landed && !prefersReducedMotion()
  const showResult = book !== null && (landed || !roll)

  return (
    <Modal open={open} onClose={onClose} title={t('books.randomTitle')}>
      {book === null ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full justify-center gap-3 overflow-hidden" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="w-[104px] shrink-0 animate-pulse" style={{ animationDelay: `${index * 90}ms` }}>
                <Placeholder />
              </div>
            ))}
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">{t('books.randomSearching')}</p>
        </div>
      ) : null}

      {roll ? <RandomBookReel candidates={candidates} target={book} onLanded={handleLanded} /> : null}

      {showResult ? (
        <div className="flex flex-col items-center gap-4">
          <Link
            to={`/books/${book.id}`}
            onClick={onClose}
            className="block w-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <CoverImage
              coverPath={book.coverPath}
              alt={book.name}
              sizes="160px"
              className="aspect-[2/3] w-full rounded-xl object-cover shadow-2xl shadow-stone-900/20"
              fallback={
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 via-paper-100 to-neon-indigo/15 text-sm text-stone-400 dark:from-ink-700 dark:via-ink-800 dark:to-ink-900 dark:text-stone-500">
                  {t('common.none')}
                </div>
              }
            />
          </Link>

          <div className="text-center">
            <Link
              to={`/books/${book.id}`}
              onClick={onClose}
              className="text-base font-semibold text-stone-800 hover:underline dark:text-stone-100"
            >
              {book.name}
            </Link>
            {book.secundaryName ? (
              <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{book.secundaryName}</p>
            ) : null}
            <div className="mt-2 flex items-center justify-center gap-2">
              <StatusBadge status={book.status} />
              {book.rating > 0 ? (
                <span className="text-sm text-stone-500 dark:text-stone-400">{formatRating(book.rating)}</span>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-2">
            {book.url ? <ReadButton url={book.url} className="btn-secondary flex-1 justify-center" /> : null}
            <button
              type="button"
              className="btn-secondary flex-1 justify-center"
              onClick={onPickAgain}
              disabled={picking}
            >
              {picking ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-teal-500 dark:border-stone-500 dark:border-t-neon-teal"
                  aria-hidden="true"
                />
              ) : (
                <Dices className="h-4 w-4" aria-hidden="true" />
              )}
              {t('books.randomAgain')}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
