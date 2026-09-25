import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Minus, Plus } from 'lucide-react'

const QUICK_AMOUNTS = [1, 3, 5, 10]

interface MenuPosition {
  top: number
  left: number
  maxHeight: number
}

interface AddChaptersMenuProps {
  onAdd: (amount: number) => void
  iconOnly?: boolean
  align?: 'left' | 'right'
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddChaptersMenu({ onAdd, iconOnly = false, align = 'right', disabled = false, onOpenChange }: AddChaptersMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    onOpenChange?.(open)
    return () => {
      if (open) onOpenChange?.(false)
    }
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false)
        setMenuPosition(null)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setMenuPosition(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    const updatePlacement = () => {
      const container = containerRef.current
      const menu = menuRef.current
      if (!container || !menu) return
      const triggerRect = container.getBoundingClientRect()
      const menuWidth = menu.offsetWidth || 256
      const menuHeight = menu.scrollHeight || menu.offsetHeight || 280
      const gap = 8
      const viewportPadding = 12
      const availableBelow = Math.max(
        0,
        window.innerHeight - triggerRect.bottom - gap - viewportPadding,
      )
      const availableAbove = Math.max(0, triggerRect.top - gap - viewportPadding)
      const placeAbove = availableBelow < menuHeight && availableAbove > availableBelow
      const availableHeight = placeAbove ? availableAbove : availableBelow
      const maxHeight = Math.min(448, availableHeight)
      const renderedHeight = Math.min(menuHeight, maxHeight)
      const preferredLeft =
        align === 'right' ? triggerRect.right - menuWidth : triggerRect.left
      const maxLeft = Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding)
      const left = Math.min(Math.max(preferredLeft, viewportPadding), maxLeft)
      const preferredTop = placeAbove
        ? triggerRect.top - renderedHeight - gap
        : triggerRect.bottom + gap
      const maxTop = Math.max(
        viewportPadding,
        window.innerHeight - renderedHeight - viewportPadding,
      )
      const top = Math.min(Math.max(preferredTop, viewportPadding), maxTop)
      setMenuPosition({ top, left, maxHeight })
    }
    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)
    window.visualViewport?.addEventListener('resize', updatePlacement)
    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
      window.visualViewport?.removeEventListener('resize', updatePlacement)
    }
  }, [open, align])

  const commit = (amount: number) => {
    if (!Number.isInteger(amount) || amount <= 0) return
    setOpen(false)
    setMenuPosition(null)
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
        onClick={() => {
          setMenuPosition(null)
          setOpen((current) => !current)
        }}
        className={
          iconOnly
            ? 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-stone-950/45 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-linear-to-r hover:from-teal-500 hover:to-neon-sky hover:shadow-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60 sm:h-8 sm:w-8 dark:border-white/20 dark:bg-white/10 dark:hover:from-neon-teal dark:hover:to-neon-indigo dark:hover:text-ink-950'
            : 'grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-stone-200/80 text-stone-500 transition hover:border-teal-400 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 dark:border-white/10 dark:text-stone-400 dark:hover:border-neon-indigo/60 dark:hover:text-neon-indigo'
        }
      >
        {iconOnly ? <Plus className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                top: menuPosition?.top ?? -10000,
                left: menuPosition?.left ?? -10000,
                maxHeight: menuPosition?.maxHeight,
                visibility: menuPosition ? 'visible' : 'hidden',
              }}
              className="glass-strong fixed z-[100] w-64 max-h-[min(28rem,calc(100svh-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-3 animate-pop sm:w-72"
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
                className="chip h-11 min-w-11 justify-center px-2.5 sm:h-8"
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-1.5 sm:flex-1">
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-stone-200/80 text-stone-500 transition hover:border-teal-400 hover:text-teal-600 sm:h-8 sm:w-8 dark:border-white/10 dark:text-stone-400 dark:hover:border-neon-indigo/60 dark:hover:text-neon-indigo"
                  onClick={() => bumpCustom(-1)}
                  aria-label="−1"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input h-11 min-w-0 flex-1 px-2 text-center text-base sm:h-8 sm:text-sm"
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
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-linear-to-br from-teal-500 to-neon-sky text-white shadow-md shadow-teal-500/30 transition hover:scale-105 sm:h-8 sm:w-8 dark:from-neon-indigo dark:to-neon-sky dark:text-ink-950"
                  onClick={() => bumpCustom(1)}
                  aria-label="+1"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                className="btn-primary w-full px-3.5 text-xs sm:ml-auto sm:w-auto sm:h-8 sm:min-h-0"
                disabled={!customValid}
                onClick={() => commit(customAmount)}
              >
                {t('books.add')}
              </button>
            </div>
          </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}