import { expect, Page } from '@playwright/test';
import { resolve } from 'node:path';

export const password = 'DemoLola2026!';
export function futureDay(days: number) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 3600000 + days * 86400000)); }
export async function login(page: Page, role: 'pegawai' | 'pemilik', next?: string) {
  await page.goto(`/masuk${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  await page.getByLabel('Email', { exact: true }).fill(`${role}@lola.test`);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}
export async function logout(page: Page) { await page.goto('/akun'); await page.getByRole('button', { name: 'Keluar', exact: true }).click(); await expect(page).toHaveURL(/\/masuk/); }
export async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), page.url()).toBe(true); }
export async function chooseSlot(page: Page, days: number, court = 'Futsal Sintetis') {
  await page.goto(`/?date=${futureDay(days)}`);
  await page.getByRole('tab', { name: new RegExp(court) }).click();
  await page.getByRole('heading', { name: court, exact: true }).waitFor();
  await page.getByRole('button', { name: new RegExp(`^${court} .* Tersedia$`) }).first().click();
  await expect(page.getByRole('complementary', { name: 'Ringkasan pilihan' })).toBeVisible();
}
/** Mengisi data pemesan tanpa akun dan mengembalikan kode booking. */
export async function confirmBooking(page: Page, name = 'Raka Uji', phone = '081234567890') {
  await page.getByLabel('Nama pemesan', { exact: true }).fill(name);
  await page.getByLabel('Nomor WhatsApp', { exact: true }).fill(phone);
  await page.getByRole('button', { name: /^Pesan sekarang/ }).click();
  await expect(page).toHaveURL(/\/reservasi\/LS-[A-Z0-9]{6}/);
  return page.url().match(/\/reservasi\/(LS-[A-Z0-9]{6})/)![1];
}
export async function uploadProof(page: Page) {
  await page.getByLabel('Bukti pembayaran', { exact: true }).setInputFiles(resolve('apps/web/public/bukti-demo.png'));
  await expect(page.getByAltText('Pratinjau bukti yang akan dikirim')).toBeVisible();
  await page.getByRole('button', { name: 'Kirim bukti pembayaran', exact: true }).click();
  await expect(page.getByText('Bukti terkirim. Pembayaran menunggu pemeriksaan pegawai.', { exact: true })).toBeVisible();
}
export function monitor(page: Page) { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 500) errors.push(r.status() + ' ' + r.url()); }); page.on('console', message => { if (message.type() === 'error' && /hydration|hydrating|uncaught/i.test(message.text())) errors.push(message.text()); }); return errors; }
