import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Enable parallel execution inside individual spec files
  fullyParallel: true,
  
  // Set parallel worker processes
  workers: 3,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/execution-results.json' }]
  ],
  timeout: 60000,

  expect: {
    // Extends default expect(locator).toBeVisible() wait time from 5s to 10s
    timeout: 10000,
  },

  use: {
    baseURL: 'https://sandbox.moodledemo.net',
    headless: false,                                   //'https://mhufrostlor-qa.learningmate.com' ,                              // 'https://sandbox.moodledemo.net',
    trace: 'on',         //'retain-on-failure',

    // --- VISUAL ARTIFACT SETTINGS ---
    video:  'on',      //'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});