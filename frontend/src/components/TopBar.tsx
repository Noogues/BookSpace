import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, LogIn, LogOut, Search } from 'lucide-react'
import { getNavItems } from '../lib/nav'
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
    <header className="sticky top-0 z-40 px-4 pt-3 md:px-8 lg:px-10">
    <div className="relative mx-auto flex h-14 max-w-[1600px] items-center rounded-2xl border border-stone-200/60 bg-paper-50/70 px-3 shadow-[0_1px_2px_rgba(28,25,23,0.05),0_12px_32px_-12px_rgba(28,25,23,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-ink-900/70 dark:shadow-black/40">

      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-teal-500/50 to-transparent dark:via-neon-teal/40"
        aria-hidden="true"
      />

      {/* Marca */}
      <Link
        to="/"
        className="group flex shrink-0 items-center gap-2 px-1"
        aria-label={t('app.name')}
      >
        <BookOpen
          className="h-5 w-5 text-teal-600 transition-transform duration-200 group-hover:-rotate-6 dark:text-neon-teal"
          aria-hidden="true"
        />
        <span className="flex font-display text-lg font-semibold tracking-tight">
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
        className="ml-5 hidden items-center gap-0.5 md:flex"
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
          className="flex h-9 items-center gap-2 rounded-xl px-2.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
        >
          <Search className="h-4 w-4" aria-hidden="true" />

          <span className="hidden text-sm sm:inline">
            {t('books.search.trigger')}
          </span>
        </button>

        <span
          className="mx-1 h-4 w-px bg-stone-200/70 dark:bg-white/10"
          aria-hidden="true"
        />

        <LanguageSwitcher />
        <ThemeToggle />

        <span
          className="mx-1 h-4 w-px bg-stone-200/70 dark:bg-white/10"
          aria-hidden="true"
        />

        {user ? (
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-xl px-2.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
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
            className="flex h-9 items-center gap-2 rounded-xl px-2.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
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