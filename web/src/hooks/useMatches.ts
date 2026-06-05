import { useQuery } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Match } from '../types'
import { qk } from './queryKeys'

export function useMatches() {
  return useQuery({
    queryKey: qk.matches,
    queryFn: () => api.get<Match[]>('/api/matches').then((res) => res.data),
  })
}
