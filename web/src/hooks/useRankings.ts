import { useQuery } from '@tanstack/react-query'

import { api } from '../services/api'
import type { RankingRow } from '../types'
import { qk } from './queryKeys'

export function useRankings() {
  return useQuery({
    queryKey: qk.rankings,
    queryFn: () => api.get<RankingRow[]>('/api/rankings').then((res) => res.data),
  })
}
