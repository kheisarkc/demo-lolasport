import { expect, test } from '@playwright/test';
import { noOverflow } from './helpers';

test('the frontend can reach Laravel and PostgreSQL', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok', database: 'connected' });
});

test('the demo catalog is readable without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Cari waktu mainmu' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Futsal Arena', exact: true })).toBeVisible();
  await expect(page.getByText('Demo lokal', { exact: true })).toBeVisible();
  await noOverflow(page);
});
