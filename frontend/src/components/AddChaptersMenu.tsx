import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Minus, Plus } from 'lucide-react'

const QUICK_AMOUNTS = [1, 3, 5, 10]

interface AddChaptersMenuProps {
  onAdd: (amount: number) => void
  iconOnly?: boolean
  align?: 'left' | 'right'
  disabled?: boolean
}

export function AddChaptersMenu({ onAdd, iconOnly = false, align = 'right', disabled = false }: AddChaptersMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const commit = (amount: number) => {
    if (!Number.isInteger(amount) || amount <= 0) return
    setOpen(false)
    setCustom('')
    onAdd(amount)
  }

  const customAmount = Number(custom)
  const customValid = Number.isInteger(customAmount) && customAmount > 0

  const bumpCustom = (delta: number) => {
    const base = Number.isInteger(customAmount) && customAmount > 0 ? customAmount : 0
    setCustom(String(Math.max(1, base + delta)))
  }

  const handleCustomChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCustom(event.target.value.replace(/[^\d]/g, ''))
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        title={t('books.addChapters')}
        aria-label={t('books.addChapters')}
        onClick={() => setOpen((current) => !current)}
        className={
          iconOnly
            ? 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-stone-950/45 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-linear-to-r hover:from-teal-500 hover:to-neon-sky hover:shadow-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-white/10 dark:hover:from-neon-teal dark:hover:to-neon-indigo dark:hover:text-ink-950'
            : 'grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-stone-200/80 text-stone-500 transition hover:border-teal-400 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-stone-400 dark:hover:border-neon-indigo/60 dark:hover:text-neon-indigo'
        }
      >
        {iconOnly ? <Plus className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
      </button>

      {open ? (
        <div
          role="menu"
          className={`glass-strong absolute top-full z-30 mt-2 w-56 p-3 animate-pop ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            {t('books.addChapters')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                role="menuitem"
                className="chip h-8 min-w-11 justify-center px-2.5"
                onClick={() => commit(amount)}
              >
                +{amount}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-stone-200/70 pt-3 dark:border-white/10">
            <p className="mb-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
              {t('books.chapterAmount')}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-stone-200/80 text-stone-500 transition hover:border-teal-400 hover:text-teal-600 dark:border-white/10 dark:text-stone-400 dark:hover:border-neon-indigo/60 dark:hover:text-neon-indigo"
                onClick={() => bumpCustom(-1)}
                aria-label="−1"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                className="input h-8 px-2 text-center text-sm"
                value={custom}
                placeholder="0"
                onChange={handleCustomChange}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && customValid) commit(customAmount)
                }}
                aria-label={t('books.chapterAmount')}
              />
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-teal-500 to-neon-sky text-white shadow-md shadow-teal-500/30 transition hover:scale-105 dark:from-neon-indigo dark:to-neon-sky dark:text-ink-950"
                onClick={() => bumpCustom(1)}
                aria-label="+1"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn-primary ml-auto h-8 px-3.5 text-xs"
                disabled={!customValid}
                onClick={() => commit(customAmount)}
              >
                {t('books.add')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}