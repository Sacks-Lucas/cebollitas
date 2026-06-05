import { es } from '../i18n/es'
import { useMatches } from '../hooks/useMatches'
import { PageSpinner } from '../components/Spinner'
import type { MatchResult } from '../types'

const resultStyles: Record<MatchResult, { label: string; className: string }> = {
  win: {
    label: es.matchResultWin,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  loss: {
    label: es.matchResultLoss,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
  draw: {
    label: es.matchResultDraw,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
}

// Format an ISO date (YYYY-MM-DD) as DD/MM/YYYY without timezone shifts.
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

const headerCell = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-argentina-navy/70 dark:text-gray-300'
const bodyCell = 'px-4 py-3 text-sm text-argentina-navy dark:text-gray-100'

export function FootballMatchesPage() {
  const { data: matches = [], isLoading } = useMatches()

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{es.footballMatches}</h2>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-argentina-celeste/20 bg-white dark:divide-argentina-celeste/20 dark:bg-argentina-navy">
                {matches.map((match) => {
                  const result = resultStyles[match.result]
                  return (
                    <tr key={match.id} className="transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/10">
                      <td className={`${bodyCell} font-medium`}>{match.playerName}</td>
                      <td className={bodyCell}>{formatDate(match.date)}</td>
                      <td className={bodyCell}>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${result.className}`}>
                          {result.label}
                        </span>
                      </td>
                      <td className={`${bodyCell} text-right tabular-nums`}>{match.goals ?? 0}</td>
                      <td className={bodyCell}>{match.stadium ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
