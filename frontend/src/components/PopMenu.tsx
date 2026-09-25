import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface PopMenuProps {
  label: string
  active?: boolean
  badge?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  widthClassName?: string
  buttonClassName?: string
}

export function PopMenu({
  label,
  active = false,
  badge,
  open,
  onOpenChange,
  children,
  widthClassName = 'w-72',
  buttonClassName = '',
}: PopMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<{
    align: 'left' | 'right'
    side: 'top' | 'bottom'
  }>({ align: 'left', side: 'bottom' })

  useLayoutEffect(() => {
    if (!open) return
    const updatePlacement = () => {
      const container = ref.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const menu = container.querySelector('[role="menu"]')
      const menuWidth = menu?.getBoundingClientRect().width ?? 288
      const menuHeight = menu?.getBoundingClientRect().height ?? 320
      const align =
        rect.left + menuWidth > window.innerWidth - 12 && rect.left > window.innerWidth - rect.right
          ? 'right'
          : 'left'
      const side =
        window.innerHeight - rect.bottom < Math.min(menuHeight, 320) && rect.top > window.innerHeight - rect.bottom
          ? 'top'
          : 'bottom'
      setPlacement((current) =>
        current.align === align && current.side === side ? current : { align, side },
      )
    }
    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)
    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOpenChange(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  const highlighted = open || active

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={`${highlighted ? 'hud-btn hud-btn-active' : 'hud-btn'} ${buttonClassName}`}
      >
        <span className="min-w-0 max-w-40 truncate">{label}</span>
        {badge !== undefined && badge > 0 ? (
          <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded bg-teal-500 px-1 text-[10px] font-bold text-white dark:bg-neon-teal dark:text-ink-950">
            {badge}
          </span>
        ) : (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className={`glass-strong absolute z-10 max-h-[min(20rem,calc(100svh-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-auto rounded-xl p-2 animate-pop ${widthClassName} ${
            placement.align === 'right' ? 'right-0' : 'left-0'
          } ${placement.side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

interface PopMenuOptionProps {
  checked: boolean
  label: string
  count?: number
  role?: 'menuitemradio' | 'menuitemcheckbox'
  onSelect: () => void
}

export function PopMenuOption({
  checked,
  label,
  count,
  role = 'menuitemradio',
  onSelect,
}: PopMenuOptionProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      onClick={onSelect}
      className={
        checked
          ? 'hud-btn hud-btn-active w-full justify-start px-2'
          : 'hud-btn w-full justify-start px-2'
      }
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
          checked
            ? 'border-transparent bg-teal-500 text-white dark:bg-neon-teal dark:text-ink-950'
            : 'border-stone-300 dark:border-white/20'
        }`}
      >
        {checked ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {count !== undefined ? <span className="shrink-0 text-xs opacity-60">{count}</span> : null}
    </button>
  )
}