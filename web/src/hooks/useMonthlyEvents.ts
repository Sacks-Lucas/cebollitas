import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Event, MonthlyEventCard } from '../types'
import { qk } from './queryKeys'

export function useMonthlyEvents() {
  return useQuery({
    queryKey: qk.monthlyEvents.cards,
    queryFn: () => api.get<MonthlyEventCard[]>('/api/monthly-events').then((res) => res.data),
  })
}

type MonthlyEventPayload = {
  title: string
  description: string
  date: string
  location: string
  amount: number
  imageUrl: string
  imagePosition: string
  eventType: 'monthly_event'
  organizerId: string | null
  attendeeIds: string[]
}

export function useCreateMonthlyEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      month,
      payload,
      asAdmin,
    }: {
      month: number
      payload: MonthlyEventPayload
      asAdmin: boolean
    }) => {
      const path = asAdmin
        ? `/api/admin/monthly-events/${month}/event`
        : `/api/monthly-events/${month}/event`
      return api.post<Event>(path, payload).then((res) => res.data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.monthlyEvents.all })
      void queryClient.invalidateQueries({ queryKey: qk.events.all })
      void queryClient.invalidateQueries({ queryKey: qk.rankings })
    },
  })
}

export function useUpdateMonthlyEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: MonthlyEventPayload }) =>
      api.put<Event>(`/api/monthly-events/${eventId}`, payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: qk.monthlyEvents.all })
      void queryClient.invalidateQueries({ queryKey: qk.events.all })
      void queryClient.invalidateQueries({ queryKey: qk.events.detail(variables.eventId) })
      void queryClient.invalidateQueries({ queryKey: qk.rankings })
    },
  })
}
