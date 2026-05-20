import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../services/api'
import { qk } from './queryKeys'

type AdminMe = { isAdmin: boolean; email: string }

export function useAdminMe(enabled: boolean) {
  return useQuery({
    queryKey: qk.admin.me,
    queryFn: () => api.get<AdminMe>('/api/admin/me').then((res) => res.data),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDownloadBackup() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<Blob>('/api/admin/backup', { responseType: 'blob' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(response.data)
      link.download = 'cebollitas-backup.zip'
      link.click()
      window.URL.revokeObjectURL(link.href)
    },
  })
}
