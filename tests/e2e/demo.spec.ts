import { expect, Page, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const password = 'DemoLola2026!';
async function login(page: Page, email: string) {
  await page.getByRole('button', { name: 'Masuk / daftar' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keluar', exact: true })).toBeVisible();
}
async function logout(page: Page) {
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Masuk / daftar' })).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('customer DP → staff verification → settlement → owner receipts', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await login(page, 'pemilik@lola.test');
  await expect(page.getByTestId('report-total')).toBeVisible();
  const baselineText = await page.getByTestId('report-total').innerText();
  const baseline = Number(baselineText.replace(/\D/g, ''));
  await logout(page);
  await login(page, 'pelanggan@lola.test');
  const future = new Date(Date.now() + (testInfo.project.name.includes('mobile') ? 12 : 11) * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Tanggal bermain').fill(future);
  await expect(page.getByRole('heading', { name: 'Futsal Arena' })).toBeVisible();
  const slot = page.locator('.court-card').filter({ has: page.getByRole('heading', { name: 'Futsal Arena' }) }).locator('.slots button:not([disabled])').first();
  await expect(slot).toBeEnabled();
  await slot.click();
  await page.getByRole('button', { name: 'Buat reservasi', exact: true }).click();
  await expect(page.getByText('Reservasi dibuat. Lanjutkan pembayaran simulasi.')).toBeVisible();
  const reservationText = await page.locator('.section-heading').getByText(/^Reservasi #/).innerText();
  const id = reservationText.match(/#(\d+)/)![1];
  const exampleDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Unduh bukti fiktif siap unggah (PNG)' }).click();
  const example = await exampleDownload;
  expect(example.suggestedFilename()).toBe('bukti-demo.png');
  const proofPath = testInfo.outputPath('bukti-demo.png');
  await example.saveAs(proofPath);
  const proof = await readFile(proofPath);
  await page.getByLabel('Bukti fiktif').setInputFiles({ name: 'bukti-demo.png', mimeType: 'image/png', buffer: proof });
  await page.getByRole('button', { name: 'Kirim bukti pembayaran' }).click();
  await expect(page.getByRole('heading', { name: 'Menunggu verifikasi' })).toBeVisible();
  await expect(page.getByText('Sudah diterima', { exact: true }).locator('..').locator('strong')).toHaveText(/^Rp\s*0$/);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('customer-dp.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reservasi saya' })).toBeVisible();
  await logout(page);
  await login(page, 'pegawai@lola.test');
  await page.getByRole('button', { name: 'Reservasi & verifikasi', exact: true }).click();
  await page.getByRole('button', { name: `Detail #${id}`, exact: true }).click();
  await page.getByRole('button', { name: 'Setujui pembayaran', exact: true }).click();
  await expect(page.getByText('Pembayaran disetujui dan tercatat.')).toBeVisible();
  await expect(page.locator('.section-heading').getByText('Terkonfirmasi', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: /Unduh bukti/ }).first().click();
  expect((await download).suggestedFilename()).toMatch(/bukti-demo-/);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('staff-verified.png'), fullPage: true });
  await logout(page);
  await login(page, 'pelanggan@lola.test');
  await page.getByRole('button', { name: 'Reservasi saya', exact: true }).click();
  await page.getByRole('button', { name: `Detail #${id}`, exact: true }).click();
  await page.getByLabel('Metode').selectOption('qris');
  await page.getByLabel('Bukti fiktif').setInputFiles({ name: 'pelunasan-demo.png', mimeType: 'image/png', buffer: proof });
  await page.getByRole('button', { name: 'Kirim bukti pembayaran' }).click();
  await expect(page.getByRole('heading', { name: 'Menunggu verifikasi' })).toBeVisible();
  await logout(page);
  await login(page, 'pegawai@lola.test');
  await page.getByRole('button', { name: 'Reservasi & verifikasi', exact: true }).click();
  await page.getByRole('button', { name: `Detail #${id}`, exact: true }).click();
  await page.getByRole('button', { name: 'Setujui pembayaran', exact: true }).click();
  await expect(page.getByText('Tagihan sudah lunas.')).toBeVisible();
  await logout(page);
  await login(page, 'pemilik@lola.test');
  await expect(page.getByTestId('report-total')).toBeVisible();
  const finalTotal = Number((await page.getByTestId('report-total').innerText()).replace(/\D/g, ''));
  expect(finalTotal - baseline).toBe(150000);
  await expect(page.locator('tbody tr').filter({ hasText: `#${id} · Futsal Arena` })).toHaveCount(2);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('owner-receipts.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('registration keeps customer role, session logout and CSRF are enforced over HTTP', async ({ page, request }) => {
  const origin = 'http://127.0.0.1:3001';
  const missing = await request.post('/api/v1/login', { headers: { Origin: origin, Accept: 'application/json' }, data: { email: 'pelanggan@lola.test', password } });
  expect(missing.status()).toBe(419);
  await page.goto('/');
  await page.getByRole('button', { name: 'Masuk / daftar' }).click();
  await page.getByRole('button', { name: 'Belum punya akun? Daftar' }).click();
  await page.getByLabel('Nama fiktif').fill('Pelanggan Tes Fiktif');
  await page.getByLabel('Email', { exact: true }).fill(`demo-${Date.now()}@example.test`);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByLabel('Ulangi kata sandi').fill(password);
  await page.getByRole('button', { name: 'Buat akun', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reservasi saya' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reservasi saya' })).toBeVisible();
  await logout(page);
  const me = await page.request.get('/api/v1/me', { headers: { Origin: origin, Accept: 'application/json' } });
  expect(me.status()).toBe(401);
});

test('staff manages walk-in, cash, cancellation and master on desktop and mobile', async ({ page }, testInfo) => {
  await page.goto('/');
  await login(page, 'pegawai@lola.test');
  const future = new Date(Date.now() + (testInfo.project.name.includes('mobile') ? 16 : 15) * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Tanggal bermain').fill(future);
  const court = page.locator('.court-card').filter({ has: page.getByRole('heading', { name: 'Badminton 1', exact: true }) });
  await court.locator('.slots button:not([disabled])').first().click();
  await page.getByLabel('Nama pelanggan fiktif').fill('Tim Walk-in Fiktif');
  await page.getByRole('button', { name: 'Buat reservasi', exact: true }).click();
  await expect(page.getByText('Reservasi dibuat. Lanjutkan pembayaran simulasi.')).toBeVisible();
  await page.getByLabel('Metode').selectOption('cash');
  await page.getByLabel('Nominal (rupiah)').fill('50000');
  await page.getByRole('button', { name: 'Catat tunai diterima' }).click();
  await expect(page.getByText('Tagihan sudah lunas.')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Batalkan reservasi', exact: true }).click();
  await expect(page.getByText('Reservasi dibatalkan dan slot dilepas.')).toBeVisible();
  await page.getByRole('button', { name: 'Kelola lapangan', exact: true }).click();
  const master = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Badminton 2', exact: true }) });
  await master.getByLabel('Harga per jam').fill('50000');
  await master.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByText('Data lapangan disimpan. Harga reservasi lama tetap.')).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('staff-master.png'), fullPage: true });
});
