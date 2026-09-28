export function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

export const COVER_VARIANT_WIDTHS = [200, 800] as const

const COVER_VARIANT_SUFFIX = /_(\d+)\.webp$/i
const REMOTE_COVER = /^(https?:|data:|blob:|\/\/)/i

export function resolveCoverPath(coverPath: string): string {
  const value = coverPath.trim()
  if (!value) return ''
  if (/^(https?:|data:|blob:|\.\.\/|\/|\/\/)/i.test(value)) return value
  return `/covers/${value.replace(/^\/+/, '')}`
}

function storedCoverFilename(coverPath: string): string | null {
  const value = coverPath.trim()
  if (!value || REMOTE_COVER.test(value)) return null
  const coversPrefix = /^\/?covers\//i
  if (coversPrefix.test(value)) return value.replace(coversPrefix, '')
  return value.startsWith('/') ? null : value
}

export function coverSrcSet(coverPath: string): string | undefined {
  const filename = storedCoverFilename(coverPath)
  if (!filename) return undefined
  const variant = COVER_VARIANT_SUFFIX.exec(filename)
  if (!variant) return undefined
  const base = filename.slice(0, variant.index)
  return COVER_VARIANT_WIDTHS.map((width) => `/covers/${base}_${width}.webp ${width}w`).join(', ')
}