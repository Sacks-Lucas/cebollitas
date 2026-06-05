import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../services/api'
import { qk } from './queryKeys'
import type { User } from '../types'

type LoginResponse = { token: string; user: User }

export function useLoginWithGoogle() {
  return useMutation({
    mutationFn: (googleToken: string) =>
      api.post<LoginResponse>('/api/auth/google', { token: googleToken }).then((res) => res.data),
  })
}

// Refreshes the authenticated user (notably their roles) from the backend so a
// session persisted before roles existed — or whose roles changed server-side —
// stays in sync without forcing a re-login.
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api.get<User>('/api/me').then((res) => res.data),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
