import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'

import { useAuth } from '../contexts/AuthContext'
import { es } from '../i18n/es'

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { loginWithGoogleToken } = useAuth()

  const onLogin = async (token: string) => {
    try {
      await loginWithGoogleToken(token)
      navigate('/rankings')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? es.unauthorizedScreen)
    }
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-argentina-celeste/50 to-white p-4 dark:from-argentina-navy dark:to-argentina-navyDeep">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white/90 p-6 text-center shadow dark:bg-argentina-navy">
        <h1 className="text-2xl font-semibold">{es.loginTitle}</h1>
        {clientId ? (
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                void onLogin(credentialResponse.credential)
              }
            }}
            onError={() => setError(es.unauthorizedScreen)}
          />
        ) : (
          <button
            type="button"
            onClick={() => void onLogin('mock:sackslm0@gmail.com')}
            className="w-full rounded bg-argentina-celeste px-4 py-2 text-white"
          >
            {es.loginWithGoogle}
          </button>
        )}
        {!clientId ? <p className="text-xs text-gray-600 dark:text-gray-200">{es.mockLoginHint}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}
