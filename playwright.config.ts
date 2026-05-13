import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
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
    // ── Admin ──────────────────────────────────────────────────────────────────

    {
      name: 'admin-setup',
      testDir: './tests/admin',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      testIgnore: /auth\.setup\.ts|login\.negative\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['admin-setup'],
    },
    {
      name: 'admin-login',
      testDir: './tests/admin',
      testMatch: /login\.negative\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Manager ────────────────────────────────────────────────────────────────

    {
      name: 'manager-setup',
      testDir: './tests/manager',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'manager',
      testDir: './tests/manager',
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/manager.json',
      },
      dependencies: ['manager-setup'],
    },
  ],

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
});
