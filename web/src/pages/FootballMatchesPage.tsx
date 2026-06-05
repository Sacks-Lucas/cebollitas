import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

import { es } from '../i18n/es'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCreateMatch, useDeleteMatch, useMatches, useUpdateMatch } from '../hooks/useMatches'
import { useUsers } from '../hooks/useUsers'
import { MatchModal, type MatchSubmitValues } from '../components/MatchModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageSpinner } from '../components/Spinner'
import type { Match, MatchResult } from '../types'

const resultStyles: Record<MatchResult, { label: string; className: string }> = {
  win: {
    label: es.matchResultWin,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  draw: {
    label: es.matchResultDraw,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  loss: {
    label: es.matchResultLoss,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
}

// Result filter options, in the requested order: Victoria, Empate, Derrota.
const resultOptions: MatchResult[] = ['win', 'draw', 'loss']

type SortDir = 'asc' | 'desc'

// Format an ISO date (YYYY-MM-DD) as DD/MM/YYYY without timezone shifts.
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

const selectClass =
  'rounded border border-argentina-celeste/40 bg-white p-2 text-sm text-argentina-navyDeep dark:border-argentina-celeste/40 dark:bg-argentina-navy dark:text-white'
const headerCell = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-argentina-navy/70 dark:text-gray-300'
const bodyCell = 'px-4 py-3 text-sm text-argentina-navy dark:text-gray-100'

export function FootballMatchesPage() {
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const { data: matches = [], isLoading: matchesLoading } = useMatches()
  const { data: users = [], isLoading: usersLoading } = useUsers()

  const createMatch = useCreateMatch()
  const updateMatch = useUpdateMatch()
  const deleteMatch = useDeleteMatch()

  const [playerId, setPlayerId] = useState('')
  const [result, setResult] = useState<'' | MatchResult>('')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Match | undefined>()
  const [deleting, setDeleting] = useState<Match | null>(null)

  // Player options list every user with the FUTBOL role (even those without
  // matches yet), sorted by name. Reused by the filter and the admin picker.
  const futbolPlayers = useMemo(
    () =>
      users
        .filter((member) => member.roles.includes('FUTBOL'))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  )

  const visibleMatches = useMemo(() => {
    const filtered = matches.filter(
      (match) => (!playerId || match.userId === playerId) && (!result || match.result === result),
    )
    return filtered.sort((a, b) =>
      sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
    )
  }, [matches, playerId, result, sortDir])

  const canManage = (match: Match) => isAdmin || match.userId === user?.id

  const handleSubmit = async (values: MatchSubmitValues) => {
    try {
      if (editing) {
        await updateMatch.mutateAsync({
          id: editing.id,
          payload: { goals: values.goals, stadium: values.stadium, date: values.date },
        })
        showToast(es.matchUpdatedSuccess, 'success')
      } else {
        await createMatch.mutateAsync({
          result: values.result,
          goals: values.goals,
          stadium: values.stadium,
          date: values.date,
          userId: values.userId,
        })
        showToast(es.matchCreatedSuccess, 'success')
      }
    } catch (err) {
      showToast(es.matchSaveError, 'error')
      throw err
    }
  }

  const isLoading = matchesLoading || usersLoading

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{es.footballMatches}</h2>
        <button
          type="button"
          className="ml-auto rounded bg-argentina-celeste px-3 py-2 text-sm text-white transition hover:bg-argentina-celesteDark"
          onClick={() => {
            setEditing(undefined)
            setShowModal(true)
          }}
        >
          {es.createMatch}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className={selectClass}>
          <option value="">{es.filterByPlayer}</option>
          {futbolPlayers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select
          value={result}
          onChange={(e) => setResult(e.target.value as '' | MatchResult)}
          className={selectClass}
        >
          <option value="">{es.filterByResult}</option>
          {resultOptions.map((value) => (
            <option key={value} value={value}>
              {resultStyles[value].label}
            </option>
          ))}
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)} className={selectClass}>
          <option value="desc">{es.sortDateDesc}</option>
          <option value="asc">{es.sortDateAsc}</option>
        </select>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : matches.length === 0 ? (
        <p>{es.matchesEmpty}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-argentina-celeste/40 shadow-lg shadow-argentina-celeste/20 dark:border-argentina-celeste/50 dark:shadow-black/60">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-argentina-celeste/15 dark:bg-argentina-navy">
                <tr>
                  <th className={headerCell}>{es.matchPlayer}</th>
                  <th className={headerCell}>{es.matchDate}</th>
                  <th className={headerCell}>{es.matchResult}</th>
                  <th className={`${headerCell} text-right`}>{es.matchGoals}</th>
                  <th className={headerCell}>{es.matchStadium}</th>
                  <th className={`${headerCell} text-right`}>{es.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-argentina-celeste/20 bg-white dark:divide-argentina-celeste/20 dark:bg-argentina-navy">
                {visibleMatches.length === 0 ? (
                  <tr>
                    <td className={`${bodyCell} text-center text-gray-500 dark:text-gray-400`} colSpan={6}>
                      {es.matchesNoResults}
                    </td>
                  </tr>
                ) : (
                  visibleMatches.map((match) => {
                    const styled = resultStyles[match.result]
                    return (
                      <tr key={match.id} className="transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/10">
                        <td className={`${bodyCell} font-medium`}>{match.playerName}</td>
                        <td className={bodyCell}>{formatDate(match.date)}</td>
                        <td className={bodyCell}>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styled.className}`}>
                            {styled.label}
                          </span>
                        </td>
                        <td className={`${bodyCell} text-right tabular-nums`}>{match.goals ?? 0}</td>
                        <td className={bodyCell}>{match.stadium ?? '—'}</td>
                        <td className={`${bodyCell} text-right`}>
                          {canManage(match) ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                aria-label={es.editMatch}
                                title={es.editMatch}
                                className="rounded p-1 hover:bg-argentina-celeste/20"
                                onClick={() => {
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
                                onClick={() => setDeleting(match)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal ? (
        <MatchModal
          players={futbolPlayers}
          isAdmin={isAdmin}
          initial={editing}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title={es.deleteMatchTitle}
          message={es.deleteMatchConfirm}
          confirmLabel={es.deleteAction}
          pendingLabel={es.deletingMatch}
          danger
          isPending={deleteMatch.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await deleteMatch.mutateAsync(deleting.id)
              showToast(es.matchDeletedSuccess, 'success')
              setDeleting(null)
            } catch {
              showToast(es.matchDeleteError, 'error')
            }
          }}
        />
      ) : null}
    </section>
  )
}
