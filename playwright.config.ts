import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.TEST_BASE_URL || (process.env.CI ? 'http://localhost:3000' : 'http://localhost:3002')

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    // In CI we test against the production build (`npm start`).
    // Locally we use the dev server to avoid requiring a pre-built app.
    command: process.env.CI ? 'npm start' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
})
