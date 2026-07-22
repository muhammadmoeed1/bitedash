import { defineConfig, devices } from '@playwright/test'

// Runs against real dev servers + the real (seeded) database — there is no mocked-backend
// mode here, unlike the Vitest suites. Run `npm run seed` in backend/ first so the demo
// accounts this spec logs in as actually exist. Deliberately NOT wired into CI (see README):
// the project's CI intentionally has zero live-database dependency.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '.',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      cwd: '../backend',
      url: 'http://localhost:6006/health',
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
})
