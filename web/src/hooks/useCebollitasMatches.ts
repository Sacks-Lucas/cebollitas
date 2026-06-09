import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../services/api'
import type { CebollitasMatch, CebollitasMatchPayload } from '../types'
import { qk } from './queryKeys'

const BASE = '/api/cebollitas-matches'

export function useCebollitasMatches() {
  return useQuery({
    queryKey: qk.cebollitasMatches,
    queryFn: () => api.get<CebollitasMatch[]>(BASE).then((res) => res.data),
  })
}

export function useCreateCebollitasMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CebollitasMatchPayload) => api.post<CebollitasMatch>(BASE, payload).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.cebollitasMatches })
    },
  })
}

export function useUpdateCebollitasMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CebollitasMatchPayload }) =>
      api.put<CebollitasMatch>(`${BASE}/${id}`, payload).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.cebollitasMatches })
    },
  })
}

export function useDeleteCebollitasMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/${id}`).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.cebollitasMatches })
    },
  })
}
