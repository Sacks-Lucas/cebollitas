import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAdminMe } from '../hooks/useAdmin'
import { useLoginWithGoogle, useMe } from '../hooks/useAuth'
import { useToast } from './ToastContext'
import { es } from '../i18n/es'
import { SESSION_EXPIRED_EVENT } from '../services/api'
import type { RoleCode, User } from '../types'

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isAdminLoading: boolean
  roles: RoleCode[]
  hasRole: (role: RoleCode) => boolean
  loginWithGoogleToken: (googleToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'user'
const TOKEN_KEY = 'token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [storedUser, setStoredUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  const adminQuery = useAdminMe(Boolean(token))
  const isAdmin = Boolean(adminQuery.data?.isAdmin)

  // Keep the user in sync with the backend (roles can be added/changed
  // server-side) without forcing a re-login. The fresh copy from /api/me wins
  // over the one persisted at login time; localStorage is updated as a cache.
  const meQuery = useMe(Boolean(token))
  const user = meQuery.data ?? storedUser
  useEffect(() => {
    if (meQuery.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(meQuery.data))
    }
  }, [meQuery.data])
  // Loading only while we have a token but haven't received the admin verdict yet.
  // Without a token there's nothing to wait for — isAdmin is just false.
  const isAdminLoading = Boolean(token) && adminQuery.isLoading

  // Guard against sessions persisted before roles existed (user.roles undefined).
  const roles = useMemo<RoleCode[]>(() => user?.roles ?? [], [user])
  const hasRole = (role: RoleCode) => roles.includes(role)

  const loginMutation = useLoginWithGoogle()

  const loginWithGoogleToken = async (googleToken: string) => {
    const data = await loginMutation.mutateAsync(googleToken)
    setStoredUser(data.user)
    setToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    localStorage.setItem(TOKEN_KEY, data.token)
  }

  const logout = () => {
    setStoredUser(null)
    setToken(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    queryClient.clear()
  }

  // When a request 401s with an expired/invalid JWT, log out (ProtectedRoute
  // then redirects to /login) and inform the user.
  useEffect(() => {
    const onSessionExpired = () => {
      if (!localStorage.getItem(TOKEN_KEY)) return
      logout()
      showToast(es.sessionExpired, 'info')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin,
      isAdminLoading,
      roles,
      hasRole,
      loginWithGoogleToken,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, isAdmin, isAdminLoading, roles],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
