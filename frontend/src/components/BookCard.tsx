import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Book } from '../lib/types'
import { formatRating, resolveCoverPath } from '../lib/format'
import { StatusBadge } from './StatusBadge'
import { AddChaptersMenu } from './AddChaptersMenu'
import { TagPill } from './TagPill'

function Cover({ coverPath, name }: { coverPath: string | null; name: string }) {
  const { t } = useTranslation()
  const [broken, setBroken] = useState(false)

  if (!coverPath || broken) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-teal-100 via-paper-100 to-stone-200 dark:from-ink-700 dark:via-ink-800 dark:to-ink-900">
        <BookOpen className="h-8 w-8 text-teal-300 dark:text-neon-indigo/60" aria-hidden="true" />
        <span className="px-3 text-center text-xs text-stone-400 dark:text-stone-500">
          {t('common.none')}
        </span>
      </div>
    )
  }

  return (
    <img
      src={resolveCoverPath(coverPath)}
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      decoding="async"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      onError={() => setBroken(true)}
    />
  )
}

interface BookCardProps {
  book: Book
  onAdvance?: (book: Book, amount: number) => void
}

export function BookCard({ book, onAdvance }: BookCardProps) {
  const { t } = useTranslation()

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    el.style.setProperty('--rx', `${(-py * 9).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(px * 11).toFixed(2)}deg`)
  }

  const handleLeave = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--rx', '0deg')
    event.currentTarget.style.setProperty('--ry', '0deg')
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transform: 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
      className="group relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/80 shadow-lg shadow-stone-900/5 backdrop-blur-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out will-change-transform animate-fade-up hover:border-neon-sky/50 hover:shadow-2xl hover:shadow-teal-500/15 dark:border-white/10 dark:bg-white/5 dark:hover:border-neon-indigo/50 dark:hover:shadow-[0_18px_50px_-12px_rgba(129,140,248,0.3)]"
    >
      <Link
        to={`/books/${book.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
      >
        <div className="relative aspect-2/3 w-full overflow-hidden bg-stone-200 dark:bg-ink-800">
          <Cover coverPath={book.coverPath} name={book.name} />

          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-white/5 dark:via-neon-indigo/10 dark:to-neon-teal/5" />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-stone-950/90 via-stone-950/40 to-transparent p-3 pt-14">
            <h3 className="font-display text-base font-semibold leading-snug text-white">
              {book.name}
            </h3>
            {book.secundaryName ? (
              <p className="mt-0.5 truncate text-xs text-stone-300">{book.secundaryName}</p>
            ) : null}

            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-medium text-stone-100 backdrop-blur-sm">
                {t('books.lastChapter')} {book.lastChapter}
              </span>
              {book.rating > 0 ? (
                <span className="inline-flex items-center gap-0.5 font-semibold text-neon-teal">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  {formatRating(book.rating)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="absolute left-2 top-2">
            <StatusBadge status={book.status} />
          </div>
        </div>
      </Link>

      {book.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-2 pt-2 pb-1">
          {book.tags.slice(0, 3).map(({ tag }) => (
            <TagPill key={tag.id} name={tag.name} size="sm" />
          ))}
          {book.tags.length > 3 ? (
            <TagPill name={`+${book.tags.length - 3}`} size="sm" />
          ) : null}
        </div>
      ) : null}

      {onAdvance ? (
        <div className="absolute right-2 top-2 z-10">
          <AddChaptersMenu
            iconOnly
            align="right"
            onAdd={(amount) => onAdvance(book, amount)}
          />
        </div>
      ) : null}
    </div>
  )
}
