import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LogIn } from 'lucide-react'
import { Modal } from './Modal'
import { useAuth } from '../auth/auth-context'
import { useToast } from './toast-context'
import { errorStatus } from '../lib/api'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useTranslation()
  const { push } = useToast()
  const { signIn } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFailed(false)
    try {
      await signIn(username, password)
      setUsername('')
      setPassword('')
      push('success', t('auth.loggedIn'))
      onClose()
    } catch (error) {
      if (errorStatus(error) === 401) setFailed(true)
      else push('error', t('errors.unknown'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title={t('auth.title')}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-username" className="label">
            {t('auth.username')}
          </label>
          <input
            id="login-username"
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={submitting}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="label">
            {t('auth.password')}
          </label>
          <input
            id="login-password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={submitting}
            required
          />
        </div>

        {failed ? <p className="text-sm text-rose-600 dark:text-rose-400">{t('auth.failed')}</p> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting || !username.trim() || !password}>
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <LogIn className="h-4 w-4" aria-hidden="true" />
            )}
            {t('auth.login')}
          </button>
        </div>
      </form>
    </Modal>
  )
}