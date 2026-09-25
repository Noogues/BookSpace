import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search } from 'lucide-react'
import { listBooks } from '../lib/api'
import type { Book } from '../lib/types'
import { resolveCoverPath } from '../lib/format'

interface CommandSearchProps {
  onClose: () => void
  onApplyName: (name: string) => void
}

export function CommandSearch({ onClose, onApplyName }: CommandSearchProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Book[]>([])
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasQuery = query.trim().length > 0

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    const raw = query.trim()
    let active = true
    let id: number | undefined
    if (raw.length < 2) {
      id = window.setTimeout(() => {
        if (!active) return
        setSuggestions([])
        setHighlighted(0)
      }, 0)
    } else {
      id = window.setTimeout(() => {
        listBooks({ name: raw, page: 1, pageSize: 6 })
          .then((data) => {
            if (!active) return
            setSuggestions(data.items)
            setHighlighted(0)
          })
          .catch(() => {
            if (!active) return
            setSuggestions([])
            setHighlighted(0)
          })
      }, 200)
    }
    return () => {
      active = false
      if (id !== undefined) window.clearTimeout(id)
    }
  }, [query])

  const applyFilter = () => {
    if (!hasQuery) return
    onApplyName(query.trim())
    onClose()
  }

  const openBook = (id: number) => {
    onClose()
    navigate(`/books/${id}`)
  }

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((current) => Math.min(current + 1, suggestions.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (highlighted === 0) applyFilter()
      else openBook(suggestions[highlighted - 1].id)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex justify-center bg-ink-950/50 p-3 pt-[8vh] backdrop-blur-md animate-fade-up sm:p-4 sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t('books.search.title')}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="glass-strong h-fit max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-hidden rounded-2xl animate-pop">
        <div className="flex items-center gap-3 border-b border-stone-200/60 px-4 dark:border-white/10">
          <Search
            className="h-5 w-5 shrink-0 text-stone-400 dark:text-stone-500"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            className="w-full flex-1 bg-transparent py-4 text-base text-stone-800 outline-none placeholder-stone-400 dark:text-stone-100 dark:placeholder-stone-500"
            placeholder={t('books.search.title')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t('books.search.title')}
          />
          <kbd className="hidden rounded-md border border-stone-300 bg-stone-100/70 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-stone-400 sm:inline-block dark:border-white/15 dark:bg-white/5 dark:text-stone-500">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60dvh] overflow-y-auto p-2">
          {hasQuery ? (
            <button
              type="button"
              className={`hud-btn mb-1 w-full justify-start px-3 py-2 text-left ${
                highlighted === 0 ? 'hud-btn-active font-medium' : ''
              }`}
              onClick={applyFilter}
              onMouseEnter={() => setHighlighted(0)}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{t('books.search.applyFilter', { query: query.trim() })}</span>
            </button>
          ) : (
            <p className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500">{t('books.search.hint')}</p>
          )}

          {hasQuery && suggestions.length === 0 ? (
            <p className="px-3 py-3 text-sm text-stone-400 dark:text-stone-500">{t('books.search.noResults')}</p>
          ) : null}

          {suggestions.map((book, index) => {
            const active = highlighted === index + 1
            return (
              <button
                key={book.id}
                type="button"
                className={`hud-btn w-full justify-start gap-2.5 px-3 py-2 text-left ${
                  active ? 'hud-btn-active font-medium' : ''
                }`}
                onClick={() => openBook(book.id)}
                onMouseEnter={() => setHighlighted(index + 1)}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-stone-200 dark:bg-ink-800">
                  {book.coverPath ? (
                    <img
                      src={resolveCoverPath(book.coverPath)}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <BookOpen className="h-4 w-4 text-stone-400 dark:text-stone-500" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                    {book.name}
                  </span>
                  {book.secundaryName ? (
                    <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                      {book.secundaryName}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}