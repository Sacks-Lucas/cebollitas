import { es } from '../i18n/es'
import { api } from '../services/api'

export function AdminPage() {
  return (
    <section className="rounded-lg bg-argentina-celeste/10 p-4 dark:bg-argentina-navy">
      <h2 className="mb-4 text-xl font-semibold">{es.admin}</h2>
      <button
        type="button"
        className="rounded bg-argentina-celeste px-4 py-2 text-white"
        onClick={async () => {
          const response = await api.get('/api/admin/backup', { responseType: 'blob' })
          const link = document.createElement('a')
          link.href = window.URL.createObjectURL(response.data)
          link.download = 'cebollitas-backup.zip'
          link.click()
          window.URL.revokeObjectURL(link.href)
        }}
      >
        {es.backup}
      </button>
    </section>
  )
}
