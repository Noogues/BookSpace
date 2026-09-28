import { useState, type ReactNode } from 'react'
import { coverSrcSet, resolveCoverPath } from '../lib/format'

interface CoverImageProps {
  coverPath: string | null
  alt: string
  sizes?: string
  className?: string
  loading?: 'lazy' | 'eager'
  previewUrl?: string | null
  fallback?: ReactNode
  onLoad?: () => void
}

export function CoverImage({
  coverPath,
  alt,
  sizes,
  className,
  loading = 'lazy',
  previewUrl = null,
  fallback = null,
  onLoad,
}: CoverImageProps) {
  const [broken, setBroken] = useState(false)

  if (previewUrl) {
    return (
      <img src={previewUrl} alt={alt} className={className} referrerPolicy="no-referrer" onLoad={onLoad} />
    )
  }

  if (!coverPath || broken) return <>{fallback}</>

  const srcSet = coverSrcSet(coverPath)

  return (
    <img
      src={resolveCoverPath(coverPath)}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onLoad={onLoad}
      onError={() => setBroken(true)}
    />
  )
}
