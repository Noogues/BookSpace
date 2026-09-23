import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getNavItems } from '../lib/nav'
import { useAuth } from '../auth/auth-context'

function dockClass(isActive: boolean) {
  if (isActive) {
    return 'inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 shadow-sm ring-1 ring-inset ring-teal-500/15 transition-all duration-200 dark:bg-neon-teal/10 dark:text-neon-teal dark:ring-neon-teal/20'
  }
  return 'inline-flex h-11 w-11 items-center justify-center rounded-xl text-stone-400 transition-all duration-200 hover:bg-stone-900/5 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-200'
}

export function MobileDock() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 md:hidden"
      aria-label="Main mobile"
    >
      <div className="relative flex items-center gap-1 rounded-full border border-stone-200/60 bg-paper-100/80 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_1px_2px_rgba(28,25,23,0.05),0_12px_32px_-12px_rgba(28,25,23,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-ink-900/80 dark:shadow-black/40">
        <span
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent dark:via-neon-teal/40"
          aria-hidden="true"
        />
        {getNavItems(!!user).map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={t(key)}
            aria-label={t(key)}
            className={({ isActive }) => dockClass(isActive)}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </NavLink>
        ))}
      </div>
    </nav>
  )
}