import { expect, test } from '@playwright/test';
import { apiMutation, chooseSlot, confirmBooking, futureDay, getApi, login, logout, monitor, noOverflow, screenshot, uploadProof } from './helpers';

test('stale checkout recovers and double tapping creates only one reservation', async ({ page }) => {
  await login(page, 'pelanggan'); await chooseSlot(page, 22);
  const selection = new URL(page.url()).searchParams;
  await page.getByRole('link', { name: 'Lanjutkan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Konfirmasi reservasi', exact: true })).toBeDisabled();
  const competing = await apiMutation(page, '/bookings', { court_id: Number(selection.get('court')), date: selection.get('date'), hour: Number(selection.get('hour')), duration: 1 });
  expect(competing.status).toBe(201);
  await page.getByLabel('Saya sudah memeriksa').check();
  await page.getByRole('button', { name: 'Konfirmasi reservasi', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Slot baru saja diambil');
  await page.getByRole('link', { name: 'Pilih jadwal lain', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cari waktu mainmu' })).toBeVisible();
  await chooseSlot(page, 23);
  await page.getByRole('link', { name: 'Lanjutkan', exact: true }).click();
  await page.getByLabel('Saya sudah memeriksa').check();
  let submitted = 0;
  page.on('request', r => { if (r.method() === 'POST' && r.url().endsWith('/api/v1/bookings')) submitted++; });
  await page.getByRole('button', { name: 'Konfirmasi reservasi', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page).toHaveURL(/\/reservasi\/\d+/);
  expect(submitted).toBe(1);
  const direct = page.url(); await page.reload(); await expect(page.getByRole('heading', { name: 'Futsal Arena', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Kembali ke reservasi', exact: true }).click();
  await expect(page).toHaveURL(/\/reservasi$/);
  await page.goBack(); await expect(page).toHaveURL(direct);
});

test('invalid upload and rejection show recovery without accepting payment', async ({ page }) => {
  await login(page, 'pelanggan'); await chooseSlot(page, 24);
  await page.getByRole('link', { name: 'Lanjutkan', exact: true }).click();
  const id = await confirmBooking(page);
  await page.getByLabel('Bukti fiktif', { exact: true }).setInputFiles({ name: 'bukti-terlalu-besar.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.getByRole('main').getByRole('alert')).toContainText('maksimal 2 MB');
  await expect(page.getByRole('button', { name: 'Kirim bukti pembayaran', exact: true })).toBeDisabled();
  await uploadProof(page);
  await logout(page); await login(page, 'pegawai');
  await page.goto(`/pegawai/verifikasi/${id}?q=${id}&method=transfer`);
  await page.getByRole('button', { name: 'Tolak bukti', exact: true }).click();
  await page.getByLabel('Alasan penolakan').fill('x');
  await page.getByRole('button', { name: 'Tolak dengan alasan', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Alasan penolakan').fill('Nominal pada bukti simulasi belum sesuai.');
  await page.getByRole('button', { name: 'Tolak dengan alasan', exact: true }).click();
  await expect(page.getByText('Bukti ditolak dengan alasan.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Kembali ke antrean', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`q=${id}&method=transfer`));
  await logout(page); await login(page, 'pelanggan'); await page.goto(`/reservasi/${id}`);
  await expect(page.getByText('Alasan penolakan: Nominal pada bukti simulasi belum sesuai.', { exact: true })).toBeVisible();
  const booking = await (await getApi(page, `/api/v1/bookings/${id}`)).json();
  expect(booking.status).toBe('cancelled'); expect(booking.paid_amount).toBe(0);
  await expect(page.getByRole('link', { name: 'Pilih jadwal baru' })).toBeVisible();
});

test('network errors, expired session, forbidden role and empty search recover', async ({ page }) => {
  await page.route('**/api/v1/courts*', route => route.abort('failed'));
  await page.goto('/'); await expect(page.getByRole('main').getByRole('alert')).toContainText('Koneksi ke layanan terputus');
  await page.unroute('**/api/v1/courts*'); await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Futsal Arena', exact: true })).toBeVisible();
  await page.route('**/api/v1/me', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Layanan sesi belum tersedia."}' }));
  await page.goto('/masuk'); await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeEnabled();
  await page.unroute('**/api/v1/me');
  await page.getByLabel('Email', { exact: true }).fill('pelanggan@lola.test');
  await page.getByLabel('Kata sandi', { exact: true }).fill('DemoLola2026!');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('link', { name: 'Reservasi', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reservasi saya', exact: true })).toBeVisible();
  await page.goto('/pegawai/lapangan');
  await expect(page.getByRole('heading', { name: 'Halaman untuk peran lain' })).toBeVisible();
  const denied = await getApi(page, '/api/v1/staff/courts'); expect(denied.status()).toBe(403);
  await chooseSlot(page, 25); await page.getByRole('link', { name: 'Lanjutkan', exact: true }).click();
  await page.getByLabel('Saya sudah memeriksa').check();
  await page.route('**/api/v1/bookings', route => route.request().method() === 'POST' ? route.fulfill({ status: 419, contentType: 'application/json', body: '{"message":"CSRF token mismatch."}' }) : route.continue());
  await page.getByRole('button', { name: 'Konfirmasi reservasi', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Sesi perlu diperbarui');
  await expect(page.getByRole('link', { name: 'Masuk kembali' })).toBeVisible();
  await page.unroute('**/api/v1/bookings');
  await page.route('**/api/v1/bookings', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthenticated."}' }));
  await page.goto('/reservasi'); await expect(page.getByRole('main').getByRole('alert')).toContainText('Sesi perlu diperbarui');
  await expect(page.getByRole('link', { name: 'Masuk kembali' })).toBeVisible(); await page.unroute('**/api/v1/bookings');
  await page.getByRole('link', { name: 'Masuk kembali' }).click();
  await expect(page).toHaveURL(/\/masuk\?next=/);
  await login(page, 'pegawai'); await page.goto('/pegawai/verifikasi?q=tidak-ada-hasil-demo');
  await expect(page.getByRole('heading', { name: /Tidak ada pengajuan yang cocok|Antrean sudah bersih/ })).toBeVisible();
});

test('reports validate custom periods and show a truthful empty period', async ({ page }) => {
  await login(page, 'pemilik'); await page.getByRole('button', { name: 'Rentang khusus' }).click();
  await page.getByLabel('Dari tanggal').fill('2026-11-10'); await page.getByLabel('Sampai tanggal').fill('2026-11-01');
  await page.getByRole('button', { name: 'Terapkan filter' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Tanggal akhir harus sama atau setelah tanggal awal.');
  await page.getByLabel('Dari tanggal').fill('2099-01-01'); await page.getByLabel('Sampai tanggal').fill('2099-01-02');
  await page.getByRole('button', { name: 'Terapkan filter' }).click();
  await expect(page.getByRole('heading', { name: 'Belum ada penerimaan pada periode ini' })).toBeVisible();
  await expect(page.getByTestId('report-total')).toHaveText(/^Rp\s*0$/);
  expect(await page.locator('.receipt-trend').count()).toBe(0);
  await page.reload(); await expect(page).toHaveURL(/from=2099-01-01&to=2099-01-02/);
  await page.getByRole('button', { name: 'Bulan ini' }).click(); await expect(page.getByTestId('report-total')).toBeVisible();
});

test('mobile width matrix, short viewport, focus and touch targets remain usable', async ({ page }, testInfo) => {
  test.setTimeout(360000);
  test.skip(testInfo.project.name !== 'chromium', 'The matrix explicitly sets all requested CSS viewports once.');
  const errors = monitor(page);
  for (const width of [320, 360, 390, 393, 430, 1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto('/'); await page.getByRole('heading', { name: 'Futsal Arena', exact: true }).waitFor(); await noOverflow(page);
    const sizes = await page.locator('.slot').evaluateAll(nodes => nodes.map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })));
    expect(sizes.every(size => size.width >= 44 && size.height >= 44)).toBe(true);
    const inputFonts = await page.locator('input').evaluateAll(nodes => nodes.map(node => Number.parseFloat(getComputedStyle(node).fontSize)));
    expect(inputFonts.every(size => size >= 16)).toBe(true);
    if ([320, 390, 1280].includes(width)) await screenshot(page, testInfo, `catalog-${width}`);
  }
  await login(page, 'pegawai');
  const matrixDate = futureDay(55);
  const matrixCatalog = await (await getApi(page, `/api/v1/courts?date=${matrixDate}`)).json();
  const matrixCourt = matrixCatalog.courts.find((court: { name: string }) => court.name === 'Badminton 2');
  const matrixSlot = matrixCourt.slots.find((slot: { available: boolean }) => slot.available);
  const matrixBooking = await apiMutation(page, '/bookings', { court_id: matrixCourt.id, date: matrixDate, hour: matrixSlot.hour, duration: 1, customer_name: 'Tim Matriks Fiktif' });
  expect(matrixBooking.status).toBe(201);
  const matrixId = matrixBooking.body.id;
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto(`/reservasi/${matrixId}`);
  await page.getByLabel('Bukti fiktif', { exact: true }).setInputFiles('apps/web/public/bukti-demo.png');
  await expect(page.getByAltText('Pratinjau bukti yang akan dikirim')).toBeVisible();
  await noOverflow(page); await screenshot(page, testInfo, 'payment-form-320');
  await uploadProof(page);
  const matrixDetail = await (await getApi(page, `/api/v1/bookings/${matrixId}`)).json();
  const matrixPayment = matrixDetail.payments.find((payment: { status: string }) => payment.status === 'pending');
  for (const width of [320, 360, 393, 430, 1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 480 : 844 });
    for (const route of ['/pegawai', '/pegawai/jadwal', '/pegawai/verifikasi', `/pegawai/verifikasi/${matrixId}`, '/pegawai/lapangan']) {
      await page.goto(route); await expect(page.locator('main h1')).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: /Memuat/ })).toHaveCount(0);
      if (route.includes(`/verifikasi/${matrixId}`)) await expect(page.locator('.proof-image')).toBeVisible();
      await noOverflow(page);
    }
    if (width === 320) {
      await page.getByRole('button', { name: 'Edit Badminton 2', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByLabel('Nama lapangan').focus();
      await expect(page.getByLabel('Nama lapangan')).toBeFocused();
      expect(await page.getByRole('dialog').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await screenshot(page, testInfo, 'master-editor-320');
      await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Edit Badminton 2', exact: true })).toBeFocused();
    }
  }
  const accepted = await apiMutation(page, `/payments/${matrixPayment.id}/review`, { decision: 'approved' });
  expect(accepted.status).toBe(200);
  await logout(page); await login(page, 'pemilik');
  for (const width of [320, 360, 390, 393, 430, 1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 480 : 844 });
    await page.goto('/pemilik/laporan'); await expect(page.getByTestId('report-total')).toBeVisible(); await noOverflow(page);
    if (width < 1000) { await expect(page.locator('.desktop-transactions')).toBeHidden(); await expect(page.locator('.transaction-cards')).toBeVisible(); }
  }
  expect(errors).toEqual([]);
});
