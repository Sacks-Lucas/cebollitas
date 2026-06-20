import { test, expect } from '@playwright/test'

// These smoke tests cover routing and the login screen without needing the
// backend running. They rely on the app's mock-login mode, which is active
// whenever VITE_GOOGLE_CLIENT_ID is unset (see LoginPage.tsx).

test.describe('Login screen', () => {
  test('renders the app title', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Cebollitas Oficial' })).toBeVisible()
  })

  test('shows the demo login button when no Google client id is configured', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Iniciar sesión con Google' })).toBeVisible()
    await expect(page.getByText('Modo demo activado')).toBeVisible()
  })
})

test.describe('Protected routes', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/rankings')
    await expect(page).toHaveURL(/\/login$/)
  })
})
