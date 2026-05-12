import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 3,

  timeout: 45_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: 'https://dev.quickticketai.com',
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },

  projects: [
    // Runs once before any test project — saves admin session to disk
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // All tests that need auth (everything except login.negative.spec.ts)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /login\.negative\.spec\.ts/,
    },

    // Login-page tests run unauthenticated, no dependency on setup
    {
      name: 'chromium-login',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login\.negative\.spec\.ts/,
    },
  ],

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
});
