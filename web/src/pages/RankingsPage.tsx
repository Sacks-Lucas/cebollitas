import { useEffect, useState } from 'react'

import { api } from '../services/api'
import { es } from '../i18n/es'
import type { RankingRow } from '../types'

const medals = ['🥇', '🥈', '🥉']

export function RankingsPage() {
  const [rows, setRows] = useState<RankingRow[]>([])

  useEffect(() => {
    void api.get<RankingRow[]>('/api/rankings').then((response) => setRows(response.data))
  }, [])

  return (
    <section className="rounded-lg bg-argentina-celeste/10 p-4 dark:bg-argentina-navy">
      <h2 className="mb-4 text-xl font-semibold">{es.rankings}</h2>
      {rows.length === 0 ? (
        <p>{es.noData}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Posición</th>
              <th>Nombre</th>
              <th>Puntos</th>
              <th>Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.userId} className="border-t border-argentina-celeste/20">
                <td>{medals[idx] ?? idx + 1}</td>
                <td>{row.name}</td>
                <td>{row.totalPoints}</td>
                <td>{row.attendancePercentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
