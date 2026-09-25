import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = LANGS.find((lang) => lang.code === i18n.resolvedLanguage) ?? LANGS[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const select = (code: string) => {
    setOpen(false)
    void i18n.changeLanguage(code)
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={current.label}
        title={current.label}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-9 dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-200 ${
          open ? 'bg-stone-900/5 text-stone-700 dark:bg-white/5 dark:text-stone-200' : ''
        }`}
      >
        <Languages className="h-4 w-4" aria-hidden="true" />
        <span className="uppercase">{current.code}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="glass-strong absolute right-0 top-full z-30 mt-2 w-44 max-w-[calc(100vw-1.5rem)] p-2 animate-pop"
        >
          <p className="mb-1.5 px-2 pt-1 text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            {t('common.language')}
          </p>
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="menuitem"
              className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                lang.code === current.code
                  ? 'font-semibold text-teal-700 dark:text-neon-teal'
                  : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-300 dark:hover:bg-white/5'
              }`}
              onClick={() => select(lang.code)}
            >
              <span>{lang.label}</span>
              {lang.code === current.code ? (
                <Check className="ml-auto h-4 w-4" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}