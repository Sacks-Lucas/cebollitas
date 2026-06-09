import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { es } from '../i18n/es'
import { CebollitasPitch } from './CebollitasPitch'
import type { CebollitasMatch } from '../types'

function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

const winnerBadge: Record<CebollitasMatch['winner'], { label: string; className: string }> = {
  team1: { label: es.wonTeam1, className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  team2: { label: es.wonTeam2, className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  draw: { label: es.resultDraw, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
}

export function CebollitasMatchDetailModal({ match, onClose }: { match: CebollitasMatch; onClose: () => void }) {
  const badge = winnerBadge[match.winner]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-argentina-navy"
      >
        <div className="flex items-center justify-between border-b border-argentina-celeste/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{formatDate(match.date)}</h3>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
            <span className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
              {es.canchaOption.replace('{n}', String(match.cancha))}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label={es.close} className="rounded p-1 hover:bg-argentina-celeste/20">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <CebollitasPitch match={match} />

          <div className="space-y-1 text-sm">
            {match.figura ? (
              <p>
                <span className="font-semibold">⭐ {es.figura}:</span> {match.figura}
              </p>
            ) : null}
            <p>
              <span className="font-semibold">👤 {es.organizer}:</span> {match.organizerName}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
