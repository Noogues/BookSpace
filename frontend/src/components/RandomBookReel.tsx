import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Book } from '../lib/types'
import { CoverImage } from './CoverImage'

const ITEM_WIDTH = 104
const GAP = 12
const PITCH = ITEM_WIDTH + GAP
const DUMMY_COUNT = 14
const ROLL_MS = 1650
const COVER_WAIT_MS = 600
const EASE = 'cubic-bezier(0.1, 0.72, 0.15, 1)'

interface RandomBookReelProps {
  candidates: Book[]
  target: Book
  onLanded: () => void
}

function Placeholder() {
  return <div className="aspect-[2/3] w-full rounded-xl bg-linear-to-br from-stone-200 to-stone-300 dark:from-ink-700 dark:to-ink-800" />
}

export function RandomBookReel({ candidates, target, onLanded }: RandomBookReelProps) {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const landedRef = useRef(onLanded)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [coverReady, setCoverReady] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [offset, setOffset] = useState<number | null>(null)

  useEffect(() => {
    landedRef.current = onLanded
  }, [onLanded])

  const dummies = useMemo(
    () =>
      candidates.length === 0
        ? []
        : Array.from({ length: DUMMY_COUNT }, (_, index) => candidates[index % candidates.length]),
    [candidates],
  )

  useLayoutEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const measure = () => setViewportWidth(element.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const startX = viewportWidth
  const endX = -(dummies.length * PITCH + ITEM_WIDTH / 2 - viewportWidth / 2)

  useEffect(() => {
    if (coverReady) return
    const timer = window.setTimeout(() => setCoverReady(true), COVER_WAIT_MS)
    return () => window.clearTimeout(timer)
  }, [coverReady])

  useEffect(() => {
    if (!coverReady || startX <= 0 || dummies.length === 0) return
    let glide = 0
    const place = requestAnimationFrame(() => {
      setOffset(startX)
      glide = requestAnimationFrame(() => {
        setRolling(true)
        setOffset(endX)
        timerRef.current = window.setTimeout(() => {
          setRolling(false)
          landedRef.current()
        }, ROLL_MS)
      })
    })
    return () => {
      cancelAnimationFrame(place)
      cancelAnimationFrame(glide)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [coverReady, startX, endX, dummies.length])

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className="overflow-hidden py-1"
        role="status"
        aria-live="polite"
        aria-label={t('books.randomRolling')}
      >
        <div
          className="flex items-center"
          style={{
            gap: GAP,
            transform: `translate3d(${offset ?? 0}px, 0, 0)`,
            transition: rolling ? `transform ${ROLL_MS}ms ${EASE}` : 'none',
          }}
        >
          {dummies.map((book, index) => (
            <div key={`dummy-${index}`} className="shrink-0 opacity-70" style={{ width: ITEM_WIDTH }}>
              <CoverImage
                coverPath={book.coverPath}
                alt=""
                sizes={`${ITEM_WIDTH}px`}
                className="aspect-[2/3] w-full rounded-xl object-cover"
                fallback={<Placeholder />}
              />
            </div>
          ))}
          <div
            className="shrink-0 ring-2 ring-teal-400 ring-offset-2 ring-offset-paper-50 dark:ring-neon-teal dark:ring-offset-ink-950"
            style={{ width: ITEM_WIDTH }}
          >
            <CoverImage
              coverPath={target.coverPath}
              alt={target.name}
              sizes={`${ITEM_WIDTH}px`}
              loading="eager"
              onLoad={() => setCoverReady(true)}
              className="aspect-[2/3] w-full rounded-xl object-cover shadow-xl"
              fallback={<Placeholder />}
            />
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-linear-to-r from-transparent via-white/20 to-transparent dark:via-white/8"
        aria-hidden="true"
      />
    </div>
  )
}
