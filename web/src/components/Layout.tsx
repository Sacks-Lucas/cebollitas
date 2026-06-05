import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import { es } from '../i18n/es'
import { APP_VERSION } from '../lib/version'
import { useAuth } from '../contexts/AuthContext'
import { DesktopNav, MobileNav } from './NavMenu'
import { Footer } from './Footer'
import { ThemeToggle } from './ThemeToggle'
import { TopProgressBar } from './TopProgressBar'

export function Layout() {
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-argentina-navyDeep">
      <TopProgressBar />
      <header className="border-b border-argentina-celeste/30 bg-argentina-celeste/10 px-4 py-3 dark:bg-argentina-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            to="/rankings"
            className="font-semibold text-argentina-navy dark:text-white"
            onClick={() => setMenuOpen(false)}
          >
            {es.appName}
          </Link>

          <DesktopNav />

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
            <MobileNav onNavigate={() => setMenuOpen(false)} />
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
      <main className="mx-auto w-full max-w-6xl flex-1 p-4">
        <Outlet />
      </main>
      <Footer
        companyName="Sacks Corporation"
        rightsText={es.footerRights}
        version={APP_VERSION}
        contactEmail="sacks.corp.1@gmail.com"
        contactLabel={es.footerContact}
        githubUrl="https://github.com/Sacks-Lucas/cebollitas"
        githubLabel={es.footerRepo}
        contractUrl="/contrato-cebollitas.pdf"
        contractLabel={es.footerContract}
      />
    </div>
  )
}
