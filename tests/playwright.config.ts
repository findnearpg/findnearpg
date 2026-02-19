import { defineConfig, devices } from '@playwright/test';

/**
 * Dev server E2E test configuration
 *
 * These tests run against the dev server (typically in Docker)
 * Set DEV_SERVER_URL environment variable to override the default
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    // Base URL for all tests - defaults to local dev server
    baseURL: process.env.DEV_SERVER_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start a web server - tests assume server is already running
  // This allows testing against Docker containers or remote servers
});
