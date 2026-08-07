import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Trip, TripPayload } from '../types'
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

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: qk.trips.detail(tripId ?? ''),
    queryFn: () => api.get<Trip>(`/api/trips/${tripId}`).then((res) => res.data),
    enabled: Boolean(tripId),
  })
}

// Trips feed the rankings (70 points per attendee), so every mutation has to
// invalidate them alongside the trip list.
function useTripInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.trips.all })
    void queryClient.invalidateQueries({ queryKey: qk.rankings })
  }
}

export function useCreateTrip() {
  const invalidate = useTripInvalidation()
  return useMutation({
    mutationFn: (payload: TripPayload) => api.post<Trip>('/api/trips', payload).then((res) => res.data),
    onSuccess: invalidate,
  })
}

export function useUpdateTrip() {
  const invalidate = useTripInvalidation()
  return useMutation({
    mutationFn: ({ tripId, payload }: { tripId: string; payload: TripPayload }) =>
      api.put<Trip>(`/api/trips/${tripId}`, payload).then((res) => res.data),
    onSuccess: invalidate,
  })
}

export function useDeleteTrip() {
  const invalidate = useTripInvalidation()
  return useMutation({
    mutationFn: (tripId: string) => api.delete(`/api/trips/${tripId}`),
    onSuccess: invalidate,
  })
}
