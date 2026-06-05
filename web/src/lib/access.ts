import type { RoleCode } from '../types'

// Single source of truth for which roles can reach each app route. Used both to
// guard routing (RoleRoute) and to filter the nav (Layout), so the two never
// drift. ADMIN is granted access to every route implicitly — see canAccess.
export type AppRoute = {
  to: string
  labelKey: 'rankings' | 'events' | 'monthlyEvent' | 'admin'
  roles: RoleCode[]
}

export const APP_ROUTES: AppRoute[] = [
  { to: '/rankings', labelKey: 'rankings', roles: ['CEBOLLITAS'] },
  { to: '/eventos', labelKey: 'events', roles: ['CEBOLLITAS'] },
  { to: '/evento-del-mes', labelKey: 'monthlyEvent', roles: ['CEBOLLITAS'] },
  { to: '/admin', labelKey: 'admin', roles: ['ADMIN'] },
]

// ADMIN sees every screen (existing or new), so it short-circuits to true.
// `isAdmin` is the authoritative backend verdict; the ADMIN role in userRoles is
// a synchronous fallback so access resolves without waiting for the query.
export function canAccess(required: RoleCode[], userRoles: RoleCode[], isAdmin = false): boolean {
  if (isAdmin || userRoles.includes('ADMIN')) {
    return true
  }
  return required.some((role) => userRoles.includes(role))
}

// First route the user is allowed to land on, used as the redirect target when
// they hit a page they can't access. Returns null when nothing is accessible.
export function firstAccessibleRoute(userRoles: RoleCode[], isAdmin = false): string | null {
  return APP_ROUTES.find((route) => canAccess(route.roles, userRoles, isAdmin))?.to ?? null
}
