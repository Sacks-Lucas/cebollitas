import { useMutation } from '@tanstack/react-query'

import { api } from '../services/api'

function useUploadImage(path: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<{ url: string }>(path, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.url
    },
  })
}

export function useUploadMonthlyEventImage() {
  return useUploadImage('/api/monthly-events/images')
}

export function useUploadTripImage() {
  return useUploadImage('/api/trips/images')
}
