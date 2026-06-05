import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

import { es } from '../i18n/es'
import { useAuth } from '../contexts/AuthContext'
import { NAV, canAccess, isNavGroup } from '../lib/access'
import type { NavGroup, NavNode } from '../lib/access'

const activeClass = 'font-semibold text-argentina-celesteDark dark:text-argentina-celeste'

// Filters NAV down to the nodes the current user can see. Groups keep only their
// accessible children and are dropped entirely when none remain.
function useVisibleNodes(): NavNode[] {
  const { isAdmin, roles } = useAuth()
  const visible: NavNode[] = []
  for (const node of NAV) {
    if (isNavGroup(node)) {
      const children = node.children.filter((child) => canAccess(child.roles, roles, isAdmin))
      if (children.length > 0) {
        visible.push({ labelKey: node.labelKey, children })
      }
    } else if (canAccess(node.roles, roles, isAdmin)) {
      visible.push(node)
    }
  }
  return visible
}

function DesktopDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const groupActive = group.children.some((child) => child.to === location.pathname)

  useEffect(() => {
    if (!open) {
      return
    }
    const onMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex items-center gap-1 ${groupActive ? activeClass : ''}`}
      >
        {es[group.labelKey]}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 flex min-w-48 flex-col rounded-md border border-argentina-celeste/20 bg-white p-1 shadow-lg dark:bg-argentina-navy">
          {group.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded px-3 py-2 transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/20 ${
                  isActive ? activeClass : ''
                }`
              }
            >
              {es[child.labelKey]}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function DesktopNav() {
  const nodes = useVisibleNodes()
  return (
    <nav className="hidden items-center gap-3 text-sm sm:flex">
      {nodes.map((node) =>
        isNavGroup(node) ? (
          <DesktopDropdown key={node.labelKey} group={node} />
        ) : (
          <NavLink
            key={node.to}
            to={node.to}
            className={({ isActive }) => (isActive ? activeClass : '')}
          >
            {es[node.labelKey]}
          </NavLink>
        ),
      )}
    </nav>
  )
}

export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const nodes = useVisibleNodes()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-2 py-2 transition hover:bg-argentina-celeste/10 dark:hover:bg-argentina-celeste/20 ${
      isActive ? activeClass : ''
    }`

  return (
    <>
      {nodes.map((node) =>
        isNavGroup(node) ? (
          <div key={node.labelKey} className="flex flex-col">
            <span className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {es[node.labelKey]}
            </span>
            {node.children.map((child) => (
              <NavLink key={child.to} to={child.to} onClick={onNavigate} className={(state) => `ml-2 ${linkClass(state)}`}>
                {es[child.labelKey]}
              </NavLink>
            ))}
          </div>
        ) : (
          <NavLink key={node.to} to={node.to} onClick={onNavigate} className={linkClass}>
            {es[node.labelKey]}
          </NavLink>
        ),
      )}
    </>
  )
}
