import type { RoleCode } from '../types'

export type LabelKey =
  | 'rankings'
  | 'events'
  | 'eventsAll'
  | 'monthlyEvent'
  | 'trips'
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
  // Highlight the menu entry only on an exact path match. Needed for routes that
  // are a prefix of a sibling (e.g. /events vs /events/trips); routes with their
  // own detail pages leave this off so the entry stays active on the child.
  exact?: boolean
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

// Events submenu: every flavour of event lives under /events.
const eventsChildren: AppRoute[] = [
  { to: '/events', labelKey: 'eventsAll', roles: ['CEBOLLITAS'], exact: true },
  { to: '/events/monthly', labelKey: 'monthlyEvent', roles: ['CEBOLLITAS'] },
  { to: '/events/trips', labelKey: 'trips', roles: ['CEBOLLITAS'] },
]

// Football submenu: every option is FUTBOL-only except "Partidos de Cebollitas",
// which additionally requires the CEBOLLITAS role.
const footballChildren: AppRoute[] = [
  { to: '/football/stats', labelKey: 'footballStats', roles: ['FUTBOL'] },
  { to: '/football/matches', labelKey: 'footballMatches', roles: ['FUTBOL'] },
  { to: '/football/world-cups', labelKey: 'footballWorldCups', roles: ['FUTBOL'] },
  { to: '/football/cebollitas-matches', labelKey: 'footballCebollitasMatches', roles: ['FUTBOL', 'CEBOLLITAS'] },
]

// Single source of truth for navigation AND route guarding, so the menu and the
// router never drift. ADMIN reaches every route implicitly — see canAccess.
export const NAV: NavNode[] = [
  { to: '/rankings', labelKey: 'rankings', roles: ['CEBOLLITAS'] },
  { labelKey: 'events', children: eventsChildren },
  { labelKey: 'football', children: footballChildren },
  { to: '/admin', labelKey: 'admin', roles: ['ADMIN'] },
]

// Old Spanish URLs kept alive as redirects so bookmarks and shared links from
// before the /events regrouping keep working.
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/eventos': '/events',
  '/evento-del-mes': '/events/monthly',
  '/football/estadisticas': '/football/stats',
  '/football/partidos': '/football/matches',
  '/football/mundiales': '/football/world-cups',
  '/football/partidos-cebollitas': '/football/cebollitas-matches',
}

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
