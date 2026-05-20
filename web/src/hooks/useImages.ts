import { useMutation } from '@tanstack/react-query'

import { api } from '../services/api'

export function useUploadMonthlyEventImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<{ url: string }>('/api/monthly-events/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.url
    },
  })
}
