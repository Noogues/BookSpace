import type { ReactNode } from 'react'

interface TagPillProps {
  name: string
  size?: 'sm' | 'md'
  active?: boolean
  onClick?: () => void
  className?: string
  trailing?: ReactNode
  title?: string
}

export function TagPill({
  name,
  size = 'md',
  active = false,
  onClick,
  className = '',
  trailing,
  title,
}: TagPillProps) {
  const classes = `${active ? 'chip chip-active' : 'chip'} min-w-0 max-w-full ${size === 'sm' ? 'chip-sm' : ''} ${className}`
  const content = (
    <>
      <span className="min-w-0 truncate">{name}</span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} title={title}>
        {content}
      </button>
    )
  }
  return (
    <span className={classes} title={title}>
      {content}
    </span>
  )
}
