import { expect, test } from '@playwright/test';

test('the frontend can reach Laravel and PostgreSQL', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok', database: 'connected' });
});

test('the demo catalog is readable without horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Waktunya turun ke lapangan.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pilih jadwal main' })).toBeVisible();
  await expect(page.getByText('Lingkungan demo lokal')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('catalog.png'), fullPage: true });
});
