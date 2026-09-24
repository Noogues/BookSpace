import { useEffect, useRef, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface PopMenuProps {
  label: string
  active?: boolean
  badge?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  widthClassName?: string
}

export function PopMenu({
  label,
  active = false,
  badge,
  open,
  onOpenChange,
  children,
  widthClassName = 'w-72',
}: PopMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOpenChange(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  const highlighted = open || active

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={highlighted ? 'hud-btn hud-btn-active' : 'hud-btn'}
      >
        <span className="max-w-40 truncate">{label}</span>
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
          className={`glass-strong absolute left-0 top-full z-10 mt-2 ${widthClassName} max-h-80 overflow-auto rounded-xl p-2 animate-pop`}
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