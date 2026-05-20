import { createContext, useContext, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAdminMe } from '../hooks/useAdmin'
import { useLoginWithGoogle } from '../hooks/useAuth'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  loginWithGoogleToken: (googleToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'user'
const TOKEN_KEY = 'token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  const adminQuery = useAdminMe(Boolean(token))
  const isAdmin = Boolean(adminQuery.data?.isAdmin)

  const loginMutation = useLoginWithGoogle()

  const loginWithGoogleToken = async (googleToken: string) => {
    const data = await loginMutation.mutateAsync(googleToken)
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    localStorage.setItem(TOKEN_KEY, data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    queryClient.clear()
  }

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(user && token), isAdmin, loginWithGoogleToken, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, isAdmin],
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
