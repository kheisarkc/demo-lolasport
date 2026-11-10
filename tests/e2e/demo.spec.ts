import { expect, test } from '@playwright/test';
import { chooseSlot, confirmBooking, login, logout, monitor, noOverflow, uploadProof } from './helpers';

test('guest books without an account → staff verifies DP → cash settlement → owner receipts', async ({ page }, testInfo) => {
  const errors = monitor(page);
  const days = testInfo.project.name === 'mobile-chromium' ? 4 : 3;
  await chooseSlot(page, days);
  await page.getByRole('link', { name: 'Lanjutkan', exact: true }).click();
  await expect(page.getByText('DP minimal (50%)')).toBeVisible();
  await expect(page.getByText(/unggah bukti dalam 30 menit/)).toBeVisible();
  // Durasi: ketuk jam terakhir untuk memperpanjang, lalu kembali ke 1 jam.
  await page.goBack();
  const chosen = page.getByRole('button', { name: /Futsal Sintetis .* Dipilih$/ });
  await expect(chosen).toHaveCount(1);
  await page.getByRole('button', { name: /^Futsal Sintetis .* Tersedia$/ }).first().click();
  await expect(chosen).toHaveCount(2);
  await expect(page.getByText('· 2 jam')).toBeVisible();
  await chosen.first().click();
  await expect(chosen).toHaveCount(1);
  await page.getByRole('link', { name: 'Lanjutkan', exact: true }).click();
  const code = await confirmBooking(page);
  await expect(page.getByText(`Simpan kode ${code}`, { exact: false })).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible();
  await noOverflow(page);
  await uploadProof(page);

  // Perangkat lain: buka lewat Cek pesanan dengan kode + WhatsApp.
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/reservasi/${code}`);
  await expect(page.getByRole('heading', { name: 'Buka pesanan' })).toBeVisible();
  await page.getByLabel('Nomor WhatsApp', { exact: true }).fill('0899999999');
  await page.getByRole('button', { name: 'Buka pesanan', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Kode booking atau nomor WhatsApp tidak cocok.' }).first()).toBeVisible();
  await page.getByLabel('Nomor WhatsApp', { exact: true }).fill('+62 812-3456-7890');
  await page.getByRole('button', { name: 'Buka pesanan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Futsal Sintetis', exact: true })).toBeVisible();
  await expect(page.getByText('Bukti sedang diperiksa penjaga.', { exact: false })).toBeVisible();
  // Cek pesanan: form ada di atas, kode boleh huruf kecil tanpa "LS-".
  await page.evaluate(() => localStorage.clear());
  await page.goto('/reservasi');
  await page.getByLabel('Kode booking', { exact: true }).fill(code.slice(3).toLowerCase());
  await page.getByLabel('Nomor WhatsApp', { exact: true }).fill('081234567890');
  await page.getByRole('button', { name: 'Buka pesanan', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/reservasi/${code}$`));
  await expect(page.getByText('Bukti sedang diperiksa penjaga.', { exact: false })).toBeVisible();

  await login(page, 'pegawai');
  await page.goto(`/pegawai/verifikasi/${code}`);
  await page.getByRole('button', { name: 'Setujui pembayaran', exact: true }).click();
  await expect(page.getByText('Pembayaran disetujui dan tercatat.')).toBeVisible();
  await page.goto(`/reservasi/${code}`);
  await expect(page.getByTestId('paid-amount')).toHaveText(/65\.000/);
  await page.getByRole('button', { name: /^Catat .* diterima$/ }).click();
  await expect(page.getByText('Pembayaran tunai diterima dan tercatat.')).toBeVisible();
  await expect(page.getByTestId('paid-amount')).toHaveText(/130\.000/);
  await logout(page);

  await login(page, 'pemilik');
  await expect(page.getByRole('heading', { name: 'Penerimaan pembayaran' })).toBeVisible();
  await expect(page.getByTestId('report-qris')).not.toHaveText('Rp 0');
  await expect(page.getByTestId('report-cash')).not.toHaveText('Rp 0');
  await page.getByRole('link', { name: 'Pengaturan' }).first().click();
  await expect(page.getByLabel('Batas bayar (menit)')).toHaveValue('30');
  await expect(page.getByText('Rp 130.000 / jam')).toBeVisible();
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('rejected first DP proof cancels the booking and frees the slot', async ({ page }, testInfo) => {
  const days = testInfo.project.name === 'mobile-chromium' ? 6 : 5;
  await chooseSlot(page, days, 'Badminton 1');
  await page.getByRole('link', { name: 'Lanjutkan', exact: true }).click();
  const code = await confirmBooking(page, 'Tim Uji', '081298765432');
  await uploadProof(page);
  await login(page, 'pegawai');
  await page.goto(`/pegawai/verifikasi/${code}`);
  await page.getByRole('button', { name: 'Tolak bukti', exact: true }).click();
  await page.getByLabel('Alasan penolakan').fill('Nominal tidak ada di mutasi');
  await page.getByRole('button', { name: 'Tolak dengan alasan', exact: true }).click();
  await expect(page.getByText('Bukti ditolak dengan alasan.')).toBeVisible();
  await logout(page);
  await page.goto(`/reservasi/${code}`);
  await expect(page.getByText(/Bukti DP ditolak: Nominal tidak ada di mutasi\. Pesanan dibatalkan/)).toBeVisible();
});

test('staff records a walk-in with DP at the counter and closes a slot', async ({ page }, testInfo) => {
  const days = testInfo.project.name === 'mobile-chromium' ? 8 : 7;
  await login(page, 'pegawai');
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 3600000 + days * 86400000));
  await page.goto(`/pegawai/jadwal?date=${date}`);
  await page.getByRole('button', { name: /Tambah jadwal/ }).first().click();
  await page.getByLabel('Nama pelanggan').fill('Tim Senja');
  await page.getByRole('radio', { name: 'QRIS di tempat' }).click();
  await page.getByRole('radio', { name: /^DP/ }).click();
  await page.getByRole('button', { name: /^Catat walk-in/ }).click();
  await expect(page).toHaveURL(/\/reservasi\/LS-/);
  await expect(page.getByTestId('paid-amount')).toHaveText(/65\.000/);
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect(page.getByText('QRIS · dicatat di tempat', { exact: false })).toBeVisible();
  await noOverflow(page);
});
