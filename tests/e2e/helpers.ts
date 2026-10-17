import { expect, Page, TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export const password = 'DemoLola2026!';
export const money = (value: string) => Number(value.replace(/\D/g, ''));
export function futureDay(days: number) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + days * 86400000)); }
export async function login(page: Page, role: string, next?: string) {
  await page.goto(`/masuk${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  await page.getByLabel('Email', { exact: true }).fill(`${role}@lola.test`);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}
export async function logout(page: Page) { await page.goto('/akun'); await page.getByRole('button', { name: 'Keluar', exact: true }).click(); await expect(page).toHaveURL(/\/masuk/); }
export async function getApi(page: Page, path: string) { return page.request.get(path, { headers: { Origin: new URL(page.url()).origin, Accept: 'application/json' } }); }
export async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), page.url()).toBe(true); }
export async function screenshot(page: Page, testInfo: TestInfo, name: string) {
  const folder = resolve('.runtime/reports/redesign/after'); await mkdir(folder, { recursive: true });
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('main [role="status"]').filter({ hasText: /Memuat|Memeriksa sesi/ })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${folder}/${testInfo.project.name}-${name}.png`, fullPage: true });
  await page.screenshot({ path: `${folder}/${testInfo.project.name}-${name}-viewport.png` });
}
export async function apiMutation(page: Page, path: string, data: Record<string, unknown>) {
  return page.evaluate(async ({ path, data }) => {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
    const token = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.slice(11);
    const response = await fetch(`/api/v1${path}`, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(token || '') }, body: JSON.stringify(data) });
    return { status: response.status, body: await response.json() };
  }, { path, data });
}
export async function currentBookingId(page: Page) { await expect(page).toHaveURL(/\/reservasi\/\d+/); return page.url().match(/\/reservasi\/(\d+)/)![1]; }
export async function chooseSlot(page: Page, days: number, court = 'Futsal Arena') {
  await page.goto(`/?date=${futureDay(days)}`);
  await page.getByRole('heading', { name: court, exact: true }).waitFor();
  const card = page.locator('.court-card').filter({ has: page.getByRole('heading', { name: court, exact: true }) });
  await card.getByRole('button', { name: /Tersedia/ }).first().click();
  await expect(page.getByRole('complementary', { name: 'Ringkasan pilihan' })).toBeVisible();
}
export async function confirmBooking(page: Page) { await page.getByLabel('Saya sudah memeriksa').check(); await page.getByRole('button', { name: 'Konfirmasi reservasi', exact: true }).click(); return currentBookingId(page); }
export async function uploadProof(page: Page) {
  await page.getByLabel('Bukti fiktif', { exact: true }).setInputFiles(resolve('apps/web/public/bukti-demo.png'));
  await expect(page.getByAltText('Pratinjau bukti yang akan dikirim')).toBeVisible();
  await page.getByRole('button', { name: 'Kirim bukti pembayaran', exact: true }).click();
  await expect(page.getByText('Bukti terkirim. Pembayaran menunggu pemeriksaan pegawai.', { exact: true })).toBeVisible();
}
export function monitor(page: Page) { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 500) errors.push(r.status() + ' ' + r.url()); }); page.on('console', message => { if (message.type() === 'error' && /hydration|hydrating|uncaught/i.test(message.text())) errors.push(message.text()); }); return errors; }
