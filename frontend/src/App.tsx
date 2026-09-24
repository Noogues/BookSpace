import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AmbientBackground } from './components/AmbientBackground'
import { CommandSearch } from './components/CommandSearch'
import { MobileDock } from './components/MobileDock'
import { TopBar } from './components/TopBar'
import { ToastProvider } from './components/Toast'
import { ShelfPage } from './pages/ShelfPage'
import { BookDetailPage } from './pages/BookDetailPage'
import { ImportPage } from './pages/ImportPage'
import { TagsPage } from './pages/TagsPage'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './auth/AuthProvider'

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-auto">
      <div className="mt-16 border-t border-stone-200/60 py-8 text-center text-xs text-stone-400 dark:border-white/6 dark:text-stone-500">
        © {new Date().getFullYear()} {t('app.name')}
      </div>
    </footer>
  )
}

function Shell() {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target.isContentEditable ?? false)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === '/' && !typing) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="relative min-h-svh">
      <AmbientBackground />
      <MobileDock />
      <div className="relative z-10 flex min-h-svh flex-col">
        <TopBar onSearchClick={() => setSearchOpen(true)} />
        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 pb-28 md:px-8 md:pb-8 lg:px-10">
          <Routes>
            <Route path="/" element={<ShelfPage />} />
            <Route path="/shelf" element={<Navigate to="/" replace />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </main>
      </div>
      {searchOpen ? (
        <CommandSearch
          onClose={() => setSearchOpen(false)}
          onApplyName={(name) => navigate(`/?name=${encodeURIComponent(name)}`)}
        />
      ) : null}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Shell />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}