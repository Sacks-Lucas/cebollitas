import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { api } from '../services/api'
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
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!token) return
    void api
      .get<{ isAdmin: boolean }>('/api/admin/me')
      .then((response) => setIsAdmin(Boolean(response.data.isAdmin)))
      .catch(() => setIsAdmin(false))
  }, [token])

  const loginWithGoogleToken = async (googleToken: string) => {
    const { data } = await api.post('/api/auth/google', { token: googleToken })
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    localStorage.setItem(TOKEN_KEY, data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsAdmin(false)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(user && token), isAdmin, loginWithGoogleToken, logout }),
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
