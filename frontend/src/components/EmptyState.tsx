import { BookOpen } from 'lucide-react'

interface EmptyStateProps {
  message: string
  icon?: typeof BookOpen
}

export function EmptyState({ message, icon: Icon = BookOpen }: EmptyStateProps) {
  return (
    <div className="glass flex flex-col items-center gap-3 px-6 py-16 text-center animate-fade-up">
      <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-500/15 to-neon-indigo/15 text-teal-600 dark:text-neon-teal">
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 to-neon-indigo opacity-10 blur-xl" />
        <Icon className="relative h-8 w-8" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">{message}</p>
    </div>
  )
}