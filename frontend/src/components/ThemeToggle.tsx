import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/theme-context'
import type { Theme } from '../theme/theme-context'

const THEME_LABELS: Record<Theme, string> = {
  light: 'Dark mode',
  dark: 'Light mode',
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      className="grid h-11 w-11 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:h-9 sm:w-9 dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-200"
      onClick={toggleTheme}
      aria-label={THEME_LABELS[theme]}
      title={THEME_LABELS[theme]}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}