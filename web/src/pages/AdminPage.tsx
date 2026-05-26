import { Navigate } from 'react-router-dom'

import { es } from '../i18n/es'
import { useAuth } from '../contexts/AuthContext'
import { useDownloadBackup } from '../hooks/useAdmin'
import { PageSpinner, Spinner } from '../components/Spinner'

export function AdminPage() {
  const { isAdmin, isAdminLoading } = useAuth()
  const downloadBackup = useDownloadBackup()
  const isDownloading = downloadBackup.isPending

  // Wait for the admin verdict before deciding — otherwise a real admin loading
  // /admin directly via URL would get bounced before /api/admin/me resolves.
  if (isAdminLoading) {
    return <PageSpinner />
  }
  if (!isAdmin) {
    return <Navigate to="/rankings" replace />
  }

  return (
    <section className="rounded-lg bg-argentina-celeste/10 p-4 dark:bg-argentina-navy">
      <h2 className="mb-4 text-xl font-semibold">{es.admin}</h2>
      <button
        type="button"
        disabled={isDownloading}
        className="flex items-center justify-center gap-2 rounded bg-argentina-celeste px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => downloadBackup.mutate()}
      >
        {isDownloading ? <Spinner size={16} label={es.downloadingBackup} /> : null}
        {isDownloading ? es.downloadingBackup : es.backup}
      </button>
    </section>
  )
}
