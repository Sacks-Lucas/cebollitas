import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { es } from '../i18n/es'
import { useMatchStats } from '../hooks/useMatches'
import { PageSpinner } from '../components/Spinner'
import type { PlayerStats } from '../types'

type SortKey = 'playerName' | 'played' | 'won' | 'drawn' | 'lost' | 'goals' | 'winRate'
type SortDir = 'asc' | 'desc'

const columns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'playerName', label: es.matchPlayer, align: 'left' },
  { key: 'played', label: es.statsPlayed, align: 'right' },
  { key: 'won', label: es.statsWon, align: 'right' },
  { key: 'drawn', label: es.statsDrawn, align: 'right' },
  { key: 'lost', label: es.statsLost, align: 'right' },
  { key: 'goals', label: es.statsGoals, align: 'right' },
  { key: 'winRate', label: es.statsWinRate, align: 'right' },
]

const thBase = 'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-argentina-navy/70 dark:text-gray-300'
const bodyCell = 'px-4 py-3 text-sm text-argentina-navy dark:text-gray-100'
const numCell = `${bodyCell} text-right tabular-nums`

// Rioplatense percentage: comma decimal, two digits (e.g. 85,71%).
function formatWinRate(value: number): string {
  return `${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

// Color the win rate by tier so it stands out at a glance.
function winRateClass(value: number): string {
  if (value >= 60) return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
  if (value >= 40) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
}

export function FootballStatsPage() {
  const { data: stats = [], isLoading } = useMatchStats()
  const [sortKey, setSortKey] = useState<SortKey>('playerName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const rows = [...stats]
    rows.sort((a, b) => {
      const cmp =
        sortKey === 'playerName'
          ? a.playerName.localeCompare(b.playerName)
          : (a[sortKey] as number) - (b[sortKey] as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [stats, sortKey, sortDir])

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{es.footballStats}</h2>

      {isLoading ? (
        <PageSpinner />
      ) : stats.length === 0 ? (
        <p>{es.statsEmpty}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-argentina-celeste/40 shadow-lg shadow-argentina-celeste/20 dark:border-argentina-celeste/50 dark:shadow-black/60">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-argentina-celeste/15 dark:bg-argentina-navy">
                <tr>
                  {columns.map((col) => {
                    const active = sortKey === col.key
                    return (
                      <th key={col.key} className={thBase} aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={`flex w-full select-none items-center gap-1 uppercase tracking-wide transition hover:text-argentina-celesteDark dark:hover:text-argentina-celeste ${
                            col.align === 'right' ? 'justify-end' : 'justify-start'
                          } ${active ? 'text-argentina-celesteDark dark:text-argentina-celeste' : ''}`}
                        >
                          {col.label}
                          {active ? (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : null}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-argentina-celeste/20 bg-white dark:divide-argentina-celeste/20 dark:bg-argentina-navy">
                {sorted.map((row: PlayerStats) => (
                  <tr key={row.userId} className="transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/10">
                    <td className={`${bodyCell} font-medium`}>{row.playerName}</td>
                    <td className={numCell}>{row.played}</td>
                    <td className={numCell}>{row.won}</td>
                    <td className={numCell}>{row.drawn}</td>
                    <td className={numCell}>{row.lost}</td>
                    <td className={numCell}>{row.goals}</td>
                    <td className={numCell}>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${winRateClass(row.winRate)}`}>
                        {formatWinRate(row.winRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
