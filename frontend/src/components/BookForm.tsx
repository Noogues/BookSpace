import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, BookOpen, CheckCircle2, Clock, ImagePlus, Link as LinkIcon, Minus, Plus, Sparkles, Star, X } from 'lucide-react'
import type { Book, BookInput } from '../lib/types'
import { errorStatus, listTags, uploadCover } from '../lib/api'
import { resolveCoverPath } from '../lib/format'
import { useToast } from './toast-context'
import { AddChaptersMenu } from './AddChaptersMenu'
import { TagPill } from './TagPill'

interface BookFormProps {
  initial?: Book | null
  submitting: boolean
  onSubmit: (data: BookInput) => void
}

const STATUS_OPTIONS = [
  { value: 0, icon: Clock },
  { value: 1, icon: BookOpen },
  { value: 2, icon: CheckCircle2 },
  { value: 3, icon: Ban },
]

function initialTags(book?: Book | null): string[] {
  return book ? book.tags.map((entry) => entry.tag.name) : []
}

function CoverPreview({ coverPath, previewUrl, name }: { coverPath: string | null; previewUrl: string | null; name: string }) {
  const [broken, setBroken] = useState(false)
  const src = previewUrl ?? (coverPath ? resolveCoverPath(coverPath) : '')
  if (!src) return null
  return (
    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200/70 shadow-lg dark:border-white/10">
      {broken ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-stone-200 text-[10px] text-stone-400 dark:from-ink-700 dark:to-ink-800 dark:text-stone-500">
          —
        </div>
      ) : (
        <img
          src={src}
          alt={name || 'cover'}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  )
}

export function BookForm({ initial, submitting, onSubmit }: BookFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [secundaryName, setSecundaryName] = useState(initial?.secundaryName ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [lastChapter, setLastChapter] = useState(initial ? String(initial.lastChapter) : '0')
  const [status, setStatus] = useState(initial ? String(initial.status) : '0')
  const [rating, setRating] = useState(initial ? String(initial.rating) : '0')
  const [coverPath, setCoverPath] = useState<string | null>(initial?.coverPath ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [completedAt, setCompletedAt] = useState(initial?.completedAt?.slice(0, 10) ?? '')
  const [tags, setTags] = useState<string[]>(() => initialTags(initial))
  const [tagDraft, setTagDraft] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [existingTags, setExistingTags] = useState<string[]>([])
  const { push } = useToast()
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    listTags()
      .then((result) => setExistingTags(result.map((item) => item.name).sort()))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }
    }
  }, [])

  const ratingNumber = Number(rating)
  const starCount = Math.round(Number.isFinite(ratingNumber) ? ratingNumber / 2 : 0)
  const ratingPct = Number.isFinite(ratingNumber) ? Math.max(0, Math.min(100, ratingNumber * 10)) : 0

  const addTag = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    if (!tags.includes(value)) setTags((current) => [...current, value])
    setTagDraft('')
  }

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(tagDraft)
    }
  }

  const handleCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
    const objectUrl = URL.createObjectURL(file)
    previewRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setUploading(true)
    try {
      const { path } = await uploadCover(file)
      setCoverPath(path)
      push('success', t('toast.coverUploaded'))
    } catch (error) {
      const status = errorStatus(error)
      push('error', status === 413 ? t('errors.imageTooLarge') : status === 400 ? t('errors.invalidImage') : t('errors.imageSave'))
      setPreviewUrl(null)
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }
    } finally {
      setUploading(false)
    }
  }

  const bumpChapter = (delta: number) => {
    const current = Number(lastChapter)
    const next = Number.isFinite(current) ? current + delta : 0
    setLastChapter(String(Math.max(0, next)))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = t('books.validation.name')
    if (!url.trim()) nextErrors.url = t('books.validation.url')
    const chapter = Number(lastChapter)
    if (!Number.isInteger(chapter) || chapter < 0) {
      nextErrors.lastChapter = t('books.validation.lastChapter')
    }
    const ratingValue = Number(rating)
    if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
      nextErrors.rating = t('books.validation.rating')
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})

    onSubmit({
      name: name.trim(),
      secundaryName: secundaryName.trim() || undefined,
      url: url.trim(),
      lastChapter: chapter,
      status: Number(status),
      rating: Number.isFinite(ratingValue) ? ratingValue : 0,
      coverPath: coverPath ?? undefined,
      completedAt: completedAt ? new Date(`${completedAt}T00:00:00`).toISOString() : undefined,
      tags,
    })
  }

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="animate-fade-up mt-1.5 inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-300">
        <X className="h-3 w-3" aria-hidden="true" />
        {errors[field]}
      </p>
    ) : null

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        {/* Cover preview banner */}
        <div className="glass-inset flex items-center gap-4 p-3.5">
          <CoverPreview coverPath={coverPath} previewUrl={previewUrl} name={name} />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label className="label" htmlFor="book-name">
                {t('books.name')} *
              </label>
              <input
                id="book-name"
                className="input"
                value={name}
                placeholder={t('books.name')}
                onChange={(event) => setName(event.target.value)}
              />
              {fieldError('name')}
            </div>
            <div>
              <label className="label" htmlFor="book-secundary">
                {t('books.secundaryName')}
              </label>
              <input
                id="book-secundary"
                className="input"
                value={secundaryName}
                placeholder={t('books.secundaryName')}
                onChange={(event) => setSecundaryName(event.target.value)}
              />
            </div>
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="label" htmlFor="book-url">
            <span className="inline-flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
              {t('books.url')} *
            </span>
          </label>
          <input
            id="book-url"
            type="url"
            className="input"
            value={url}
            placeholder="https://…"
            onChange={(event) => setUrl(event.target.value)}
          />
          {fieldError('url')}
        </div>

        {/* Progress row */}
        <div className="glass-inset space-y-4 p-3.5">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">
            {t('dashboard.progress')}
          </span>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="book-chapter">
                {t('books.lastChapter')}
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-stone-200/80 text-stone-500 transition hover:border-teal-400 hover:text-teal-600 sm:h-10 sm:w-10 dark:border-white/10 dark:text-stone-400 dark:hover:border-neon-indigo/60 dark:hover:text-neon-indigo"
                  onClick={() => bumpChapter(-1)}
                  aria-label="−1"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <input
                  id="book-chapter"
                  type="number"
                  min={0}
                  step={1}
                  className="input min-w-0 flex-1 text-center font-semibold"
                  value={lastChapter}
                  onChange={(event) => setLastChapter(event.target.value)}
                />
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-neon-sky text-white shadow-md shadow-teal-500/30 transition hover:scale-105 sm:h-10 sm:w-10 dark:from-neon-indigo dark:to-neon-sky dark:text-ink-950 dark:shadow-neon-indigo/30"
                  onClick={() => bumpChapter(1)}
                  aria-label="+1"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
                <AddChaptersMenu onAdd={(amount) => bumpChapter(amount)} />
              </div>
              {fieldError('lastChapter')}
            </div>

            <div>
              <label className="label" htmlFor="book-completed">
                {t('books.completedAt')}
              </label>
              <input
                id="book-completed"
                type="date"
                className="input"
                value={completedAt}
                onChange={(event) => setCompletedAt(event.target.value)}
              />
            </div>
          </div>

          <div>
            <span className="label">{t('status.label')}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t('status.label')}>
              {STATUS_OPTIONS.map(({ value, icon: Icon }) => {
                const active = status === String(value)
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setStatus(String(value))}
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      active
                        ? 'border-transparent bg-gradient-to-br from-teal-500 to-neon-sky text-white shadow-lg shadow-teal-500/30 dark:from-neon-indigo dark:to-neon-sky dark:text-ink-950 dark:shadow-neon-indigo/30'
                        : 'border-stone-200/80 text-stone-500 hover:border-stone-300 hover:bg-white/60 hover:text-stone-800 dark:border-white/10 dark:text-stone-400 dark:hover:border-white/25 dark:hover:bg-white/[0.05] dark:hover:text-stone-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t(`status.${value}`)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rating slider */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label mb-0" htmlFor="book-rating">
                {t('books.rating')}
              </label>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-sm font-bold text-teal-600 dark:bg-neon-teal/15 dark:text-neon-teal">
                {rating}
                <span className="text-[10px] font-semibold opacity-70">/10</span>
              </span>
            </div>
            <div className="mb-2 flex items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 transition-colors ${
                    index < starCount ? 'fill-neon-teal text-neon-teal' : 'fill-stone-300 text-stone-300 dark:fill-ink-700 dark:text-ink-700'
                  }`}
                />
              ))}
            </div>
            <input
              id="book-rating"
              type="range"
              min={0}
              max={10}
              step={0.5}
              className="input-range"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(217,119,6,0.85) 0%, rgba(255,122,107,0.85) ${ratingPct}%, rgba(0,0,0,0.06) ${ratingPct}%, rgba(0,0,0,0.06) 100%)`,
              }}
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            />
            {fieldError('rating')}
          </div>
        </div>

        {/* Cover */}
        <div>
          <span className="label">{t('books.cover')}</span>
          <div className="glass-inset p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`btn-secondary cursor-pointer ${uploading ? 'pointer-events-none opacity-70' : ''}`}
              >
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-teal-500 dark:border-stone-500 dark:border-t-neon-teal" aria-hidden="true" />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                )}
                {uploading ? t('books.coverUploading') : t('books.uploadCover')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => void handleCoverFile(event)}
                />
              </label>
              {coverPath ? (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setCoverPath(null)
                    setPreviewUrl(null)
                    if (previewRef.current) {
                      URL.revokeObjectURL(previewRef.current)
                      previewRef.current = null
                    }
                  }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t('books.removeCover')}
                </button>
              ) : null}
            </div>
            <div className="relative mt-3">
              <Sparkles className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-neon-indigo/70" aria-hidden="true" />
              <input
                id="book-cover"
                className="input pl-10"
                placeholder={t('books.coverUrlHint')}
                value={coverPath ?? ''}
                onChange={(event) => setCoverPath(event.target.value || null)}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <span className="label">{t('books.tags')}</span>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <TagPill
                key={tag}
                name={`#${tag}`}
                trailing={
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center rounded-full text-stone-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:h-6 sm:w-6"
                    onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                    aria-label={`${t('common.close')} ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                }
              />
            ))}
            <div className="relative min-w-0 flex-1 basis-44 sm:w-44 sm:flex-none">
              <input
                className="input h-11 w-full pr-11 text-base sm:h-9 sm:text-sm"
                placeholder={t('books.addTag')}
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagDraft)}
                list="book-tag-suggestions"
              />
              <datalist id="book-tag-suggestions">
                {existingTags.filter((name) => !tags.includes(name)).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <button
                type="button"
                className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-r-xl bg-gradient-to-br from-teal-500 to-neon-sky text-white shadow-md shadow-teal-500/25 transition hover:scale-105 sm:right-1 sm:top-1 sm:h-7 sm:w-7 sm:rounded-lg dark:from-neon-indigo dark:to-neon-sky dark:text-ink-950"
                onClick={() => addTag(tagDraft)}
                aria-label={t('books.tags')}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? null : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          {submitting ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
