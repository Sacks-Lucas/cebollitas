import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../services/api'
import type { MyVote } from '../types'
import { qk } from './queryKeys'

export function useMyVote(eventId: string | null | undefined) {
  return useQuery({
    queryKey: qk.votes.myVote(eventId ?? ''),
    queryFn: () =>
      api.get<MyVote | null>(`/api/votes/my-vote?eventId=${eventId}`).then((res) => res.data ?? null),
    enabled: Boolean(eventId),
  })
}

export function useHasVotedMany(eventIds: string[]) {
  const results = useQueries({
    queries: eventIds.map((eventId) => ({
      queryKey: qk.votes.hasVoted(eventId),
      queryFn: () =>
        api
          .get<{ hasVoted: boolean }>(`/api/votes/has-voted?eventId=${eventId}`)
          .then((res) => res.data.hasVoted),
    })),
  })

  const map: Record<string, boolean> = {}
  results.forEach((result, idx) => {
    const id = eventIds[idx]
    if (id && typeof result.data === 'boolean') map[id] = result.data
  })
  return map
}

type CastVotePayload = {
  eventId: string
  fun: number
  cost: number
  originality: number
}

export function useCastVote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CastVotePayload) => api.post('/api/votes', payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: qk.votes.hasVoted(variables.eventId) })
      void queryClient.invalidateQueries({ queryKey: qk.votes.myVote(variables.eventId) })
      void queryClient.invalidateQueries({ queryKey: qk.monthlyEvents.all })
      void queryClient.invalidateQueries({ queryKey: qk.rankings })
    },
  })
}
