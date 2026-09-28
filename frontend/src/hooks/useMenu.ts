import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react'

const ITEM_SELECTOR =
  '[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"]'

function visibleItems(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (element) => element.offsetParent !== null || element.getClientRects().length > 0,
  )
}

interface UseMenuOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
  menuRef: RefObject<HTMLElement | null>
  preferCheckedItem?: boolean
}

export function useMenu({
  open,
  onOpenChange,
  triggerRef,
  menuRef,
  preferCheckedItem = false,
}: UseMenuOptions) {
  const focusEdge = useRef<'first' | 'last'>('first')
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open) {
      if (wasOpen.current) return
      wasOpen.current = true
      const id = window.requestAnimationFrame(() => {
        const menu = menuRef.current
        if (!menu) return
        const items = visibleItems(menu)
        if (items.length === 0) return
        const target =
          focusEdge.current === 'last'
            ? items[items.length - 1]
            : (preferCheckedItem
                ? items.find((item) => item.getAttribute('aria-checked') === 'true')
                : undefined) ?? items[0]
        target.focus()
      })
      return () => window.cancelAnimationFrame(id)
    }

    if (wasOpen.current) {
      wasOpen.current = false
      const trigger = triggerRef.current
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open, menuRef, triggerRef, preferCheckedItem])

  const onTriggerKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      focusEdge.current = 'first'
      onOpenChange(true)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusEdge.current = 'last'
      onOpenChange(true)
    }
  }

  const onItemKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onOpenChange(false)
      return
    }
    if (event.key === 'Tab') {
      onOpenChange(false)
      return
    }

    const items = visibleItems(event.currentTarget as HTMLElement)
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement as HTMLElement)
    const at = index === -1 ? 0 : index

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(at + 1) % items.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(at - 1 + items.length) % items.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      items[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  return { onTriggerKeyDown, onItemKeyDown }
}
