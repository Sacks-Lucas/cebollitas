import { useQuery } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Trip } from '../types'
import { qk, type TripsFilters } from './queryKeys'

function buildQueryString(filters: TripsFilters) {
  const params = new URLSearchParams()
  if (filters.month) params.set('month', filters.month)
  if (filters.attendeeId) params.set('attendeeId', filters.attendeeId)
  return params.toString()
}

export function useTrips(filters: TripsFilters = {}) {
  return useQuery({
    queryKey: qk.trips.list(filters),
    queryFn: () => api.get<Trip[]>(`/api/trips?${buildQueryString(filters)}`).then((res) => res.data),
  })
}
