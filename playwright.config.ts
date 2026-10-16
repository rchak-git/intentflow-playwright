import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['html'], ['list']],
  use: {
    headless: true,
    trace: 'on-first-retry',

    // --- VISUAL ARTIFACT SETTINGS ---

    // Options: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry'
    video: 'on', // Records a WebM video for every test run

    // Options: 'off' | 'on' | 'only-on-failure'
    screenshot: 'on', // Captures a scr
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
