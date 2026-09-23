export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500 dark:text-stone-400">
      <div className="relative grid h-12 w-12 place-items-center">
        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500 to-neon-sky opacity-30 blur-md animate-pulse-glow dark:from-neon-indigo dark:to-neon-rose" />
        <svg className="relative h-8 w-8 animate-spin text-teal-600 dark:text-neon-teal" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
          />
        </svg>
      </div>
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  )
}