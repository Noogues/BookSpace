import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { checkHealth } from '../lib/api'
import { NAV_ITEMS } from '../lib/nav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

function linkClass(isActive: boolean) {
  if (isActive) {
    return 'inline-flex items-center gap-2 rounded-xl bg-teal-500/10 px-3 py-1.5 text-sm font-semibold text-teal-700 shadow-sm ring-1 ring-inset ring-teal-500/15 transition-all duration-200 dark:bg-neon-teal/10 dark:text-neon-teal dark:ring-neon-teal/20'
  }
  return 'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-stone-400 transition-all duration-200 hover:bg-stone-900/5 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-200'
}

export function TopBar() {
  const { t } = useTranslation()
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    checkHealth()
      .then(() => {
        if (active) setOnline(true)
      })
      .catch(() => {
        if (active) setOnline(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 md:px-8 lg:px-10">
      <div className="relative mx-auto flex h-14 max-w-[1600px] items-center gap-2 rounded-2xl border border-stone-200/60 bg-paper-50/70 px-3 shadow-[0_1px_2px_rgba(28,25,23,0.05),0_12px_32px_-12px_rgba(28,25,23,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-ink-900/70 dark:shadow-black/40">
        <span
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent dark:via-neon-teal/40"
          aria-hidden="true"
        />

        <Link
          to="/"
          className="hidden shrink-0 items-center font-display text-base font-semibold tracking-tight text-stone-900 md:inline-flex dark:text-white"
        >
          {t('app.name')}
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_ITEMS.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={t(key)}
              aria-label={t(key)}
              className={({ isActive }) => linkClass(isActive)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`mr-0.5 h-1.5 w-1.5 rounded-full transition-colors ${
              online === null
                ? 'bg-stone-300 dark:bg-ink-600'
                : online
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
            }`}
            title={online === null ? t('common.loading') : online ? 'OK' : t('errors.network')}
            aria-hidden="true"
          />
          <span className="h-5 w-px bg-stone-200/70 dark:bg-white/10" aria-hidden="true" />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}