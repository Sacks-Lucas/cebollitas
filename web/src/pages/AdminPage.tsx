import { es } from '../i18n/es'
import { useDownloadBackup } from '../hooks/useAdmin'

export function AdminPage() {
  const downloadBackup = useDownloadBackup()

  return (
    <section className="rounded-lg bg-argentina-celeste/10 p-4 dark:bg-argentina-navy">
      <h2 className="mb-4 text-xl font-semibold">{es.admin}</h2>
      <button
        type="button"
        disabled={downloadBackup.isPending}
        className="rounded bg-argentina-celeste px-4 py-2 text-white disabled:opacity-60"
        onClick={() => downloadBackup.mutate()}
      >
        {es.backup}
      </button>
    </section>
  )
}
