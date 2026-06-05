import { Navigate, Outlet } from 'react-router-dom'

import { es } from '../i18n/es'
import { useAuth } from '../contexts/AuthContext'
import { canAccess, firstAccessibleRoute } from '../lib/access'
import { PageSpinner } from './Spinner'
import type { RoleCode } from '../types'

export function RoleRoute({ roles }: { roles: RoleCode[] }) {
  const { roles: userRoles, isAdmin, isAdminLoading } = useAuth()

  if (canAccess(roles, userRoles, isAdmin)) {
    return <Outlet />
  }

  // The user's roles don't grant access. If the authoritative admin check is
  // still loading (e.g. a deep-link straight to a guarded URL), wait for the
  // verdict before bouncing so a real admin isn't redirected prematurely.
  if (isAdminLoading) {
    return <PageSpinner />
  }

  const landing = firstAccessibleRoute(userRoles, isAdmin)
  if (landing) {
    return <Navigate to={landing} replace />
  }

  return (
    <section className="rounded-lg bg-argentina-celeste/10 p-6 text-center dark:bg-argentina-navy">
      {es.noAccess}
    </section>
  )
}
