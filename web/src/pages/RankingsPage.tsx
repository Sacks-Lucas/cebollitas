import { es } from '../i18n/es'
import { useRankings } from '../hooks/useRankings'
import { PageSpinner } from '../components/Spinner'

const medals = ['🥇', '🥈', '🥉']

export function RankingsPage() {
  const { data: rows = [], isLoading } = useRankings()

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{es.rankings}</h2>
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
                <span className="font-medium">{row.name}</span>
              </div>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div className="flex gap-1">
                  <dt className="font-semibold">{es.rankingPoints}:</dt>
                  <dd>{row.totalPoints}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="font-semibold">{es.rankingAttendance}:</dt>
                  <dd>{row.attendancePercentage}%</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="font-semibold">{es.rankingAbsences}:</dt>
                  <dd>{row.absences}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
