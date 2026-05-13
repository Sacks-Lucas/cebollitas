import { Link, NavLink, Outlet } from 'react-router-dom'

import { es } from '../i18n/es'
import { useAuth } from '../contexts/AuthContext'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { to: '/rankings', label: es.rankings },
  { to: '/eventos', label: es.events },
  { to: '/evento-del-mes', label: es.monthlyEvent },
  { to: '/admin', label: es.admin },
]

export function Layout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-white dark:bg-argentina-navyDeep">
      <header className="border-b border-argentina-celeste/30 bg-argentina-celeste/10 px-4 py-3 dark:bg-argentina-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/rankings" className="font-semibold text-argentina-navy dark:text-white">
            {es.appName}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-argentina-celesteDark dark:text-argentina-celeste' : ''
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={logout} className="rounded bg-argentina-celeste px-3 py-1 text-white">
              {es.logout}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
