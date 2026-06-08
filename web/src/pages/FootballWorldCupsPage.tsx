import { es } from '../i18n/es'
import { useWorldCups } from '../hooks/useMatches'
import { PageSpinner } from '../components/Spinner'

const medals = ['🥇', '🥈', '🥉']

export function FootballWorldCupsPage() {
  const { data: rows = [], isLoading } = useWorldCups()

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{es.footballWorldCups}</h2>
      {isLoading ? (
        <PageSpinner />
      ) : rows.length === 0 ? (
        <p>{es.noData}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, idx) => (
            <li
              key={row.userId}
              className="flex flex-col gap-3 rounded-lg border border-argentina-celeste/40 bg-white p-4 shadow-lg shadow-argentina-celeste/20 dark:border-argentina-celeste/50 dark:bg-argentina-navy dark:shadow-black/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{medals[idx] ?? `#${idx + 1}`}</span>
                <span className="font-medium">{row.playerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{es.footballWorldCups}:</span>
                <span className="inline-flex items-center gap-1 text-lg font-bold tabular-nums">
                  🏆 {row.worldCups}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
