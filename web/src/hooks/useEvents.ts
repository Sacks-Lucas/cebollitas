import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Event, EventDetail } from '../types'
import { qk, type EventsFilters } from './queryKeys'

function buildQueryString(filters: EventsFilters) {
  const params = new URLSearchParams()
  if (filters.month) params.set('month', filters.month)
  if (filters.type) params.set('type', filters.type)
  if (filters.attendeeId) params.set('attendeeId', filters.attendeeId)
  return params.toString()
}

export function useEvents(filters: EventsFilters = {}) {
  return useQuery({
    queryKey: qk.events.list(filters),
    queryFn: () => api.get<Event[]>(`/api/events?${buildQueryString(filters)}`).then((res) => res.data),
  })
}

export function useEventDetail(eventId: string | null | undefined) {
  return useQuery({
    queryKey: qk.events.detail(eventId ?? ''),
    queryFn: () => api.get<EventDetail>(`/api/events/${eventId}/detail`).then((res) => res.data),
    enabled: Boolean(eventId),
  })
}

type CreateEventPayload = Omit<Event, 'id' | 'creatorId' | 'createdAt' | 'updatedAt'>

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => api.post<Event>('/api/events', payload).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.events.all })
      void queryClient.invalidateQueries({ queryKey: qk.rankings })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateEventPayload }) =>
      api.put<Event>(`/api/events/${id}`, payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: qk.events.all })
      void queryClient.invalidateQueries({ queryKey: qk.events.detail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: qk.rankings })
    },
  })
}
