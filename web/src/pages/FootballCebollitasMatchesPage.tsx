import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

import { es } from '../i18n/es'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import {
  useCebollitasMatches,
  useCreateCebollitasMatch,
  useDeleteCebollitasMatch,
  useUpdateCebollitasMatch,
} from '../hooks/useCebollitasMatches'
import { useUsers } from '../hooks/useUsers'
import { CebollitasMatchModal } from '../components/CebollitasMatchModal'
import { CebollitasMatchDetailModal } from '../components/CebollitasMatchDetailModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageSpinner } from '../components/Spinner'
import type { CebollitasMatch, CebollitasMatchPayload, CebollitasWinner } from '../types'

function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

const winnerBadge: Record<CebollitasWinner, { label: string; className: string }> = {
  team1: { label: es.wonTeam1, className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  team2: { label: es.wonTeam2, className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  draw: { label: es.resultDraw, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
}

function TeamLine({ label, players, won }: { label: string; players: string[]; won: boolean }) {
  return (
    <p className="truncate text-xs">
      <span className={`font-semibold ${won ? 'text-green-700 dark:text-green-400' : ''}`}>
        {label}
        {won ? ' 🏆' : ''}:
      </span>{' '}
      {players.join(' · ')}
    </p>
  )
}

export function FootballCebollitasMatchesPage() {
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const { data: matches = [], isLoading: matchesLoading } = useCebollitasMatches()
  const { data: users = [], isLoading: usersLoading } = useUsers()

  const createMatch = useCreateCebollitasMatch()
  const updateMatch = useUpdateCebollitasMatch()
  const deleteMatch = useDeleteCebollitasMatch()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CebollitasMatch | undefined>()
  const [detail, setDetail] = useState<CebollitasMatch | null>(null)
  const [deleting, setDeleting] = useState<CebollitasMatch | null>(null)

  const organizers = useMemo(
    () => users.filter((u) => u.roles.includes('FUTBOL')).sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  )

  const canManage = (match: CebollitasMatch) => isAdmin || match.creatorId === user?.id

  const handleSubmit = async (payload: CebollitasMatchPayload) => {
    try {
      if (editing) {
        await updateMatch.mutateAsync({ id: editing.id, payload })
        showToast(es.cebollitasUpdatedSuccess, 'success')
      } else {
        await createMatch.mutateAsync(payload)
        showToast(es.cebollitasCreatedSuccess, 'success')
      }
    } catch (err) {
      showToast(es.cebollitasSaveError, 'error')
      throw err
    }
  }

  const isLoading = matchesLoading || usersLoading

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{es.footballCebollitasMatches}</h2>
        <button
          type="button"
          className="ml-auto rounded bg-argentina-celeste px-3 py-2 text-sm text-white transition hover:bg-argentina-celesteDark"
          onClick={() => {
            setEditing(undefined)
            setShowModal(true)
          }}
        >
          {es.createCebollitasMatch}
        </button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : matches.length === 0 ? (
        <p>{es.cebollitasEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => {
            const badge = winnerBadge[match.winner]
            return (
              <li
                key={match.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(match)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setDetail(match)
                  }
                }}
                className="flex cursor-pointer flex-col gap-2 rounded-lg border border-argentina-celeste/40 bg-white p-4 shadow-lg shadow-argentina-celeste/20 transition hover:shadow-xl dark:border-argentina-celeste/50 dark:bg-argentina-navy dark:shadow-black/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{formatDate(match.date)}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-argentina-celesteDark dark:text-argentina-celeste/80">
                    {es.canchaOption.replace('{n}', String(match.cancha))}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    {canManage(match) ? (
                      <>
                        <button
                          type="button"
                          aria-label={es.editCebollitasMatch}
                          title={es.editCebollitasMatch}
                          className="rounded p-1 hover:bg-argentina-celeste/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditing(match)
                            setShowModal(true)
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={es.deleteAction}
                          title={es.deleteAction}
                          className="rounded p-1 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleting(match)
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <TeamLine label={es.team1} players={match.team1.players} won={match.winner === 'team1'} />
                  <TeamLine label={es.team2} players={match.team2.players} won={match.winner === 'team2'} />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {match.figura ? <span>⭐ {match.figura} · </span> : null}
                  👤 {match.organizerName}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      {showModal ? (
        <CebollitasMatchModal
          organizers={organizers}
          initial={editing}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {detail ? <CebollitasMatchDetailModal match={detail} onClose={() => setDetail(null)} /> : null}

      {deleting ? (
        <ConfirmDialog
          title={es.deleteCebollitasTitle}
          message={es.deleteCebollitasConfirm}
          confirmLabel={es.deleteAction}
          pendingLabel={es.deletingMatch}
          danger
          isPending={deleteMatch.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await deleteMatch.mutateAsync(deleting.id)
              showToast(es.cebollitasDeletedSuccess, 'success')
              setDeleting(null)
            } catch {
              showToast(es.cebollitasDeleteError, 'error')
            }
          }}
        />
      ) : null}
    </section>
  )
}
