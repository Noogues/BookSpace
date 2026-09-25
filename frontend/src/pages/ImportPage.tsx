import { useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, Info, Lock, UploadCloud } from 'lucide-react'
import { errorData, errorStatus, importExcel } from '../lib/api'
import type { ExcelRowError } from '../lib/types'
import { useAuth } from '../auth/auth-context'
import { LoginModal } from '../components/LoginModal'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toast-context'

type Outcome =
  | { kind: 'idle' }
  | { kind: 'success'; imported: number }
  | { kind: 'failed'; message: string }

export function ImportPage() {
  const { t } = useTranslation()
  const { push } = useToast()
  const { user } = useAuth()

  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })
  const [errors, setErrors] = useState<ExcelRowError[]>([])
  const [dragging, setDragging] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="page-title">{t('import.title')}</h1>
          <p className="page-subtitle">{t('import.subtitle')}</p>
        </div>
        <div className="glass flex flex-col items-center gap-3 p-6 text-center animate-fade-up sm:p-10">
          <Lock className="h-10 w-10 text-teal-500 dark:text-neon-teal" aria-hidden="true" />
          <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">
            {t('import.requiresLogin')}
          </p>
          <button type="button" className="btn-primary" onClick={() => setLoginOpen(true)}>
            {t('auth.login')}
          </button>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    )
  }

  const acceptFile = (candidate: File | undefined | null) => {
    if (!candidate) return
    if (!candidate.name.toLowerCase().endsWith('.xlsx')) {
      push('error', t('import.wrongType'))
      return
    }
    setFile(candidate)
    setOutcome({ kind: 'idle' })
    setErrors([])
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files?.[0])
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setErrors([])
    try {
      const result = await importExcel(file)
      setErrors(result.errors ?? [])
      setOutcome({
        kind: 'success',
        imported: result.imported,
      })
      if (result.errors?.length) {
        push('info', t('import.successWithErrors', { count: result.imported }))
      } else {
        push('success', t('import.success', { count: result.imported }))
      }
    } catch (error) {
      const status = errorStatus(error)
      const data = errorData(error)
      if (data?.errors?.length) {
        setErrors(data.errors)
      }
      if (status === 400 && data?.error) {
        setOutcome({ kind: 'failed', message: t('import.failed') })
      } else {
        setOutcome({ kind: 'failed', message: t('errors.network') })
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('import.title')}</h1>
        <p className="page-subtitle">{t('import.subtitle')}</p>
      </div>

      <div
        className={`glass relative flex flex-col items-center gap-3 border-2 border-dashed p-6 text-center transition-all duration-300 animate-fade-up sm:p-10 ${
          file ? '' : 'cursor-pointer'
        } ${
          dragging
            ? 'scale-[1.01] border-neon-teal bg-neon-teal/10 shadow-2xl shadow-neon-teal/20 dark:border-neon-indigo dark:bg-neon-indigo/10 dark:shadow-neon-indigo/20'
            : 'border-stone-300/80 hover:border-teal-400/60 dark:border-white/15 dark:hover:border-neon-indigo/50'
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={file ? undefined : openFilePicker}
      >
        <span className={`pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-teal-500/0 via-neon-rose/0 to-neon-indigo/0 blur-2xl transition-opacity ${dragging ? 'opacity-100' : 'opacity-0'}`} />
        {file ? (
          <>
            <FileSpreadsheet className="h-10 w-10 text-emerald-500" aria-hidden="true" />
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <div className="relative flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleImport()}
                disabled={importing}
              >
                {importing ? t('import.uploading') : t('import.upload')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={(event) => {
                  event.stopPropagation()
                  openFilePicker()
                }}
              >
                {t('import.replacing')}
              </button>
            </div>
          </>
        ) : (
          <>
            <UploadCloud
              className="h-10 w-10 text-teal-500 dark:text-neon-teal animate-float"
              aria-hidden="true"
            />
            <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">
              {t('import.drop')}
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={(event) => {
                event.stopPropagation()
                openFilePicker()
              }}
            >
              {t('import.select')}
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
      </div>

      <p className="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t('import.note')}
      </p>

      <div className="glass overflow-hidden animate-fade-up">
        <h2 className="border-b border-stone-200/80 px-4 py-3 text-sm font-semibold dark:border-white/10">
          {t('import.exampleTitle')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-100/90 text-left text-xs uppercase tracking-wide text-stone-500 backdrop-blur dark:bg-ink-800/90 dark:text-stone-400">
              <tr>
                <th className="px-4 py-2">{t('import.colName')}</th>
                <th className="px-4 py-2">{t('import.colSecundaryName')}</th>
                <th className="px-4 py-2">{t('import.colUrl')}</th>
                <th className="px-4 py-2">{t('import.colChapter')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-stone-100/80 dark:border-white/5">
                <td className="px-4 py-2 font-medium text-stone-800 dark:text-stone-200">
                  {t('import.exampleBook')}
                </td>
                <td className="px-4 py-2 text-stone-700 dark:text-stone-300">
                  {t('import.exampleAlt')}
                </td>
                <td className="px-4 py-2 text-stone-700 dark:text-stone-300">
                  {t('import.exampleUrl')}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-stone-500 dark:text-stone-400">
                  {t('import.exampleChapter')}
                </td>
              </tr>
              <tr className="border-t border-stone-100/80 dark:border-white/5">
                <td className="px-4 py-2 font-medium text-stone-800 dark:text-stone-200">
                  {t('import.exampleBook2')}
                </td>
                <td className="px-4 py-2 text-stone-400 dark:text-stone-500">
                  —
                </td>
                <td className="px-4 py-2 text-stone-700 dark:text-stone-300">
                  {t('import.exampleUrl2')}
                </td>
                <td className="px-4 py-2 text-stone-400 dark:text-stone-500">
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="border-t border-stone-200/80 px-4 py-3 text-xs text-stone-500 dark:border-white/10 dark:text-stone-400">
          {t('import.exampleNote')}
        </p>
      </div>

      {importing ? <Spinner label={t('import.uploading')} /> : null}

      {outcome.kind === 'success' ? (
        <div className="glass border-l-4 border-l-emerald-500 p-4 animate-fade-up">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
            {errors.length > 0
              ? t('import.successWithErrors', { count: outcome.imported })
              : t('import.success', { count: outcome.imported })}
          </p>
          <div className="mt-3">
            <Link to="/" className="btn-primary">
              {t('import.goLibrary')}
            </Link>
          </div>
        </div>
      ) : null}

      {outcome.kind === 'failed' ? (
        <div className="glass border-l-4 border-l-rose-500 p-4 animate-fade-up">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200">{outcome.message}</p>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="glass overflow-hidden animate-fade-up">
          <h2 className="border-b border-stone-200/80 px-4 py-3 text-sm font-semibold dark:border-white/10">
            {t('import.errorsTitle')} ({errors.length})
          </h2>
          <div className="max-h-80 overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="sticky top-0 bg-stone-100/90 text-left text-xs uppercase tracking-wide text-stone-500 backdrop-blur dark:bg-ink-800/90 dark:text-stone-400">
                <tr>
                  <th className="px-4 py-2">{t('import.row')}</th>
                  <th className="px-4 py-2">{t('import.error')}</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((entry) => (
                  <tr
                    key={entry.row}
                    className="border-t border-stone-100/80 dark:border-white/5"
                  >
                    <td className="px-4 py-2 align-top font-mono text-xs text-stone-500 dark:text-stone-400">
                      {entry.row}
                    </td>
                    <td className="max-w-xs break-words px-4 py-2 text-stone-700 dark:text-stone-300">
                      {entry.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}