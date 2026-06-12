import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Custom event fired when an authenticated request gets a 401 (expired/invalid
// JWT). The AuthProvider listens for it to log the user out and notify them.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

// De-duplicate the notification across the burst of parallel 401s that happens
// when a page's queries all fail at once. Reset on the next successful response.
let sessionExpiredNotified = false

api.interceptors.response.use(
  (response) => {
    sessionExpiredNotified = false
    return response
  },
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    const isLoginRequest = url.includes('/auth/google')
    const hadSession = Boolean(localStorage.getItem('token'))
    if (status === 401 && !isLoginRequest && hadSession && !sessionExpiredNotified) {
      sessionExpiredNotified = true
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function resolveApiUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = api.defaults.baseURL ?? ''
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
