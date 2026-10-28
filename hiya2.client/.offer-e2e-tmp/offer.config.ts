import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 45000,
  workers: 1,
  reporter: 'line',
  outputDir: './results',
  use: {
    baseURL: 'https://localhost:59978',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
});
