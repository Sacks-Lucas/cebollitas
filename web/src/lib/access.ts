import type { RoleCode } from '../types'

export type LabelKey =
  | 'rankings'
  | 'events'
  | 'monthlyEvent'
  | 'admin'
  | 'football'
  | 'footballStats'
  | 'footballMatches'
  | 'footballWorldCups'
  | 'footballCebollitasMatches'

// A single routable destination. `roles` lists every role the user must hold to
// reach it (AND semantics — see canAccess).
export type AppRoute = {
  to: string
  labelKey: LabelKey
  roles: RoleCode[]
}

// A top-level menu entry that expands into a submenu of routes.
export type NavGroup = {
  labelKey: LabelKey
  children: AppRoute[]
}

export type NavNode = AppRoute | NavGroup

export function isNavGroup(node: NavNode): node is NavGroup {
  return 'children' in node
}

// Football submenu: every option is FUTBOL-only except "Partidos de Cebollitas",
// which additionally requires the CEBOLLITAS role.
const footballChildren: AppRoute[] = [
  { to: '/football/estadisticas', labelKey: 'footballStats', roles: ['FUTBOL'] },
  { to: '/football/partidos', labelKey: 'footballMatches', roles: ['FUTBOL'] },
  { to: '/football/mundiales', labelKey: 'footballWorldCups', roles: ['FUTBOL'] },
  { to: '/football/partidos-cebollitas', labelKey: 'footballCebollitasMatches', roles: ['FUTBOL', 'CEBOLLITAS'] },
]

// Single source of truth for navigation AND route guarding, so the menu and the
// router never drift. ADMIN reaches every route implicitly — see canAccess.
export const NAV: NavNode[] = [
  { to: '/rankings', labelKey: 'rankings', roles: ['CEBOLLITAS'] },
  { to: '/eventos', labelKey: 'events', roles: ['CEBOLLITAS'] },
  { to: '/evento-del-mes', labelKey: 'monthlyEvent', roles: ['CEBOLLITAS'] },
  { labelKey: 'football', children: footballChildren },
  { to: '/admin', labelKey: 'admin', roles: ['ADMIN'] },
]

// Flat list of every route, derived from NAV (groups expanded). Used by route
// guards and as redirect-target lookup.
export const APP_ROUTES: AppRoute[] = NAV.flatMap((node) => (isNavGroup(node) ? node.children : [node]))

// Access requires ALL listed roles. ADMIN short-circuits to true (sees every
// screen). `isAdmin` is the authoritative backend verdict; the ADMIN role in
// userRoles is a synchronous fallback so access resolves without the query.
export function canAccess(required: RoleCode[], userRoles: RoleCode[], isAdmin = false): boolean {
  if (isAdmin || userRoles.includes('ADMIN')) {
    return true
  }
  return required.every((role) => userRoles.includes(role))
}

// First route the user is allowed to land on, used as the redirect target when
// they hit a page they can't access. Returns null when nothing is accessible.
export function firstAccessibleRoute(userRoles: RoleCode[], isAdmin = false): string | null {
  return APP_ROUTES.find((route) => canAccess(route.roles, userRoles, isAdmin))?.to ?? null
}
