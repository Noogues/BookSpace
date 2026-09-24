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
  const classes = `${active ? 'chip chip-active' : 'chip'} ${size === 'sm' ? 'chip-sm' : ''} ${className}`
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} title={title}>
        {name}
        {trailing}
      </button>
    )
  }
  return (
    <span className={classes} title={title}>
      {name}
      {trailing}
    </span>
  )
}