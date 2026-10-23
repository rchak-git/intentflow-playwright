import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['html'], ['list']],
  timeout:30000,

  expect: {
    // Extends default expect(locator).toBeVisible() wait time from 5s to 10s
    timeout: 10000,
  },
  use: {
    baseURL: 'https://sandbox.moodledemo.net',
    headless: true,
    trace: 'on-first-retry',

    // --- VISUAL ARTIFACT SETTINGS ---

    // Options: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry'
    video: 'on', // Records a WebM video for every test run

    // Options: 'off' | 'on' | 'only-on-failure'
    screenshot: 'on', // Captures a scr
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
