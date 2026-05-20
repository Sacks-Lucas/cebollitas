import { useMutation } from '@tanstack/react-query'

import { api } from '../services/api'
import type { User } from '../types'

type LoginResponse = { token: string; user: User }

export function useLoginWithGoogle() {
  return useMutation({
    mutationFn: (googleToken: string) =>
      api.post<LoginResponse>('/api/auth/google', { token: googleToken }).then((res) => res.data),
  })
}
