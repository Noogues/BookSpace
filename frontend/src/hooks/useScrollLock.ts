import { useEffect } from 'react'

let lockCount = 0

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    lockCount += 1
    if (lockCount === 1) document.body.style.overflow = 'hidden'
    return () => {
      lockCount -= 1
      if (lockCount === 0) document.body.style.overflow = ''
    }
  }, [active])
}
