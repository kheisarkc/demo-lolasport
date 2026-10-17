import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.runtime/browsers');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  expect: { timeout: 15000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://127.0.0.1:${process.env.LOLA_E2E_WEB_PORT || 3002}`, trace: process.env.CI ? 'retain-on-failure' : 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'node scripts/project.mjs e2e:serve',
    url: `http://127.0.0.1:${process.env.LOLA_E2E_WEB_PORT || 3002}/api/health`,
    reuseExistingServer: false,
    timeout: 180000,
  },
});
