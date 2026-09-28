import { defineConfig, devices } from '@playwright/test'

// BASE_URL: test a running copy (CI points it at the Docker image). Unset, the
// tests assemble the game as the image does and serve it themselves.
const external = process.env.BASE_URL
const port = Number(process.env.PORT) || 8080

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: external || `http://localhost:${port}`,
    viewport: { width: 1100, height: 760 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: external
    ? undefined
    : {
        command: `sh ../scripts/build-game.sh ../adarkroom ../build/game && PORT=${port} node ../scripts/serve.mjs ../build/game`,
        url: `http://localhost:${port}/`,
        reuseExistingServer: !process.env.CI,
      },
})
