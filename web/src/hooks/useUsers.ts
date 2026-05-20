import { useQuery } from '@tanstack/react-query'

import { api } from '../services/api'
import type { User } from '../types'
import { qk } from './queryKeys'

export function useUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: () => api.get<User[]>('/api/users').then((res) => res.data),
  })
}
