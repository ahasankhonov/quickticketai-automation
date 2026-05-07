import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 8,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'https://dev.quickticketai.com',
    headless: true,             // override with --headed flag or npm run test:headed
    launchOptions: { slowMo: 800 }, // ms delay between each action — remove when not debugging
    screenshot: 'only-on-failure',
    video: 'on-first-retry',    // captures video when a test retries (e.g. in CI)
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['html', { open: 'always' }]],
});
