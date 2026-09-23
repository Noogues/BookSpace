export function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

export function resolveCoverPath(coverPath: string): string {
  const value = coverPath.trim()
  if (!value) return ''
  if (/^(https?:|data:|blob:|\.\.\/|\/|\/\/)/i.test(value)) return value
  return `/covers/${value.replace(/^\/+/, '')}`
}