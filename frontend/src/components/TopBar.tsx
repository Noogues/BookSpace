import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, LogIn, LogOut, Search } from 'lucide-react'
import { getNavItems } from '../lib/nav'
import { BRAND_LOGO_CLASSES } from '../lib/brand'
import { useAuth } from '../auth/auth-context'
import { LoginModal } from './LoginModal'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { useToast } from './toast-context'

interface TopBarProps {
  onSearchClick: () => void
}

export function TopBar({ onSearchClick }: TopBarProps) {
  const { t } = useTranslation()
  const { push } = useToast()
  const { user, signOut } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    push('info', t('auth.loggedOut'))
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 md:px-8 lg:px-10">
    <div className="relative mx-auto flex min-h-14 min-w-0 max-w-[1600px] flex-wrap items-center rounded-2xl border border-stone-200/60 bg-paper-50/70 px-2 py-2 shadow-[0_1px_2px_rgba(28,25,23,0.05),0_12px_32px_-12px_rgba(28,25,23,0.18)] backdrop-blur-2xl sm:h-14 sm:flex-nowrap sm:px-3 sm:py-0 dark:border-white/10 dark:bg-ink-900/70 dark:shadow-black/40">

      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-teal-500/50 to-transparent dark:via-neon-teal/40"
        aria-hidden="true"
      />

      {/* Marca */}
      <Link
        to="/"
        className="group flex min-h-11 min-w-0 shrink-0 items-center gap-2 rounded-xl px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        aria-label={t('app.name')}
      >
        <span className={`${BRAND_LOGO_CLASSES} shrink-0`} aria-hidden="true">
          <BookOpen className="h-5 w-5 text-teal-600 transition-transform duration-200 group-hover:-rotate-6 dark:text-neon-teal" />
        </span>
        <span className="flex whitespace-nowrap font-display text-sm font-semibold tracking-tight sm:text-lg">
          {t('app.name').split('').map((char, index) => (
            <span
              key={index}
              className="brand-letter"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {char}
            </span>
          ))}
        </span>
      </Link>

      {/* Navegación */}
      <nav
        className="ml-5 hidden items-center gap-2 md:flex"
        aria-label="Main"
      >
        {getNavItems(!!user).map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={t(key)}
            aria-label={t(key)}
            className={({ isActive }) =>
              isActive
                ? "hud-btn hud-btn-active"
                : "hud-btn"
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Acciones */}
      <div className="ml-auto flex items-center gap-1">

        {/* Buscador */}
        <button
          type="button"
          onClick={onSearchClick}
          title={t('books.search.trigger')}
          aria-label={t('books.search.trigger')}
          className="flex h-11 min-w-11 items-center gap-2 rounded-xl px-2.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-9 sm:min-w-0 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
        >
          <Search className="h-4 w-4" aria-hidden="true" />

          <span className="hidden text-sm sm:inline">
            {t('books.search.trigger')}
          </span>
        </button>

        <span
          className="hud-sep"
          aria-hidden="true"
        />

        <LanguageSwitcher />
        <ThemeToggle />

        <span
          className="hud-sep"
          aria-hidden="true"
        />

        {user ? (
          <button
            type="button"
            className="flex h-11 min-w-11 items-center gap-2 rounded-xl px-2.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-9 sm:min-w-0 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
            onClick={() => void handleSignOut()}
            title={t('auth.logout')}
            aria-label={t('auth.logout')}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">{user}</span>
          </button>
        ) : (
          <button
            type="button"
            className="flex h-11 min-w-11 items-center gap-2 rounded-xl px-2.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-9 sm:min-w-0 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
            onClick={() => setLoginOpen(true)}
            title={t('auth.login')}
            aria-label={t('auth.login')}
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">{t('auth.login')}</span>
          </button>
        )}
      </div>
    </div>

    <LoginModal
      open={loginOpen}
      onClose={() => setLoginOpen(false)}
    />
  </header>
  )
}