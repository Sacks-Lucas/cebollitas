import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

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
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'font-semibold text-argentina-celesteDark dark:text-argentina-celeste' : ''

  return (
    <div className="min-h-screen bg-white dark:bg-argentina-navyDeep">
      <header className="border-b border-argentina-celeste/30 bg-argentina-celeste/10 px-4 py-3 dark:bg-argentina-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            to="/rankings"
            className="font-semibold text-argentina-navy dark:text-white"
            onClick={() => setMenuOpen(false)}
          >
            {es.appName}
          </Link>

          <nav className="hidden items-center gap-3 text-sm sm:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="hidden rounded bg-argentina-celeste px-3 py-1 text-white sm:block"
            >
              {es.logout}
            </button>
            <button
              type="button"
              aria-label={es.menu}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded p-1 text-argentina-navy hover:bg-argentina-celeste/20 dark:text-white sm:hidden"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="mx-auto mt-3 flex max-w-6xl flex-col gap-1 border-t border-argentina-celeste/20 pt-3 text-sm sm:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded px-2 py-2 transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/20 ${
                    isActive ? 'font-semibold text-argentina-celesteDark dark:text-argentina-celeste' : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                logout()
              }}
              className="mt-1 rounded bg-argentina-celeste px-3 py-2 text-left text-white"
            >
              {es.logout}
            </button>
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
