import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Match, MatchCreatePayload, MatchUpdatePayload, PlayerStats, PlayerWorldCups } from '../types'
import { qk } from './queryKeys'

export function useMatches() {
  return useQuery({
    queryKey: qk.matches,
    queryFn: () => api.get<Match[]>('/api/matches').then((res) => res.data),
  })
}

export function useMatchStats() {
  return useQuery({
    queryKey: qk.matchStats,
    queryFn: () => api.get<PlayerStats[]>('/api/matches/stats').then((res) => res.data),
  })
}

export function useWorldCups() {
  return useQuery({
    queryKey: qk.matchWorldCups,
    queryFn: () => api.get<PlayerWorldCups[]>('/api/matches/world-cups').then((res) => res.data),
  })
}

export function useCreateMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MatchCreatePayload) => api.post<Match>('/api/matches', payload).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.matches })
    },
  })
}

export function useUpdateMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MatchUpdatePayload }) =>
      api.put<Match>(`/api/matches/${id}`, payload).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.matches })
    },
  })
}

export function useDeleteMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/matches/${id}`).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.matches })
    },
  })
}
