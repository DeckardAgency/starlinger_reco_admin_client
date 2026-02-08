import { defineConfig, devices } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

/**
 * RECO Admin Client - E2E Test Configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: process.env['CI'] ? 1 : 4,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  // Global setup runs once before all tests - handles login
  globalSetup: require.resolve('./e2e/global-setup'),

  use: {
    baseURL: 'http://localhost:4201',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Auth tests - run WITHOUT saved auth state (need fresh session)
    {
      name: 'auth-tests',
      testMatch: /auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined, // No auth - tests login flow
      },
    },
    // All other tests - use saved auth state
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.ts/, // Exclude auth tests
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
    },
  ],

  // Run frontend dev server before tests
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4201',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },

  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});
