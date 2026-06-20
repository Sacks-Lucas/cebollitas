import { defineConfig, devices } from '@playwright/test'

// E2E config for the Cebollitas web app.
// The dev server is started automatically (mock login mode, no Google client id).
const PORT = 5173
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Enable additional browsers as needed (run `npx playwright install`):
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    // Start a fresh server so the env override below always applies; do not
    // reuse a dev server that may be running with a real Google client id.
    reuseExistingServer: false,
    timeout: 120_000,
    // Force the app into mock-login mode regardless of the developer's .env,
    // so tests are deterministic and never hit Google's OAuth iframe.
    env: { VITE_GOOGLE_CLIENT_ID: '' },
  },
})
