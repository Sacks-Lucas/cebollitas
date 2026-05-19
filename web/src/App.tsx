import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { AdminPage } from './pages/AdminPage'
import { EventsPage } from './pages/EventsPage'
import { LoginPage } from './pages/LoginPage'
import { MonthlyEventPage } from './pages/MonthlyEventPage'
import { RankingsPage } from './pages/RankingsPage'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/rankings" element={<RankingsPage />} />
                    <Route path="/eventos" element={<EventsPage />} />
                    <Route path="/evento-del-mes" element={<MonthlyEventPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/rankings" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}

export default App
