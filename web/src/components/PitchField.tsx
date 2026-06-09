import type { ReactNode } from 'react'

// Shared football-pitch background (green field + markings) used by both the
// read-only pitch and the editable lineup builder.
export function PitchField({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-green-600 to-green-700 p-3 shadow-inner">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/40" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
        <div className="absolute left-1/2 top-0 h-8 w-28 -translate-x-1/2 border-x border-b border-white/25" />
        <div className="absolute bottom-0 left-1/2 h-8 w-28 -translate-x-1/2 border-x border-t border-white/25" />
      </div>
      <div className="relative flex min-h-[26rem] flex-col">{children}</div>
    </div>
  )
}

export const TEAM1_SHIRT = 'text-sky-300'
export const TEAM2_SHIRT = 'text-rose-400'
