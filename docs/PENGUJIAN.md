# Pengujian aplikasi

## Menjalankan

Dari root setelah bootstrap dan Docker siap:

```powershell
npm run doctor
npm run check
npm run test:e2e
```

Jalankan check dan E2E secara berurutan. `check` mencakup Pint, tes backend PostgreSQL, PHPStan, ESLint, TypeScript frontend/E2E dan build. E2E memakai Chromium desktop dan emulasi Pixel7 melalui layanan3002/8002.

Guard memeriksa environment, koneksi PostgreSQL, host/port, nama dan database aktual sebelum cleanup. Tes hanya boleh membersihkan **lola_demo_test**; jangan arahkan ke lola_demo, jangan melemahkan guard, dan jangan reset volume operasional.

## Cakupan yang penting

- Hak tiga peran, kepemilikan reservasi/bukti, session dan CSRF HTTP.
- Waktu/jam/durasi, overlap, slot bersebelahan dan empat kasus konkurensi dua proses.
- Hold/expiry, bukti tepat waktu, DP, pelunasan, approval ganda, batas nominal dan pembatalan.
- File privat, penolakan beralasan, tunai pegawai, master dan blok pemeliharaan.
- Rekonsiliasi approved, filter WIB, kategori pembayaran ketika DP di luar filter, serta pembatalan tanpa refund.
- Alur browser sampai laporan, konflik saat checkout, double tap, error/kosong, Back/refresh/direct URL, serta viewport320/360/390/393/430/1280 dan viewport pendek.

Source tes: [backend](../apps/api/tests), [konkurensi](../apps/api/tests/Concurrency/ConcurrencyTest.php), [kontrak UI/API](../apps/api/tests/Feature/RedesignContractTest.php), [alur browser](../tests/e2e/demo.spec.ts), [edge cases/layout](../tests/e2e/redesign.spec.ts).

## Hasil aktual

18 Oktober 2026, Windows lokal, sesudah pembersihan dependency/perlengkapan AI:

- `npm run doctor`: exit 0; PHP 8.4.26 dengan pdo_pgsql, Node 22.16 dan PostgreSQL demo sehat. Doctor tidak memerlukan file agent.
- Sintaks launcher Node dan bootstrap PowerShell: valid. Bootstrap tidak memasang Python, Spec Kit, Codex atau MCP.
- `composer validate --no-check-publish`: manifest dan lockfile valid. `npm ci`: berhasil memasang 182 paket dari lockfile.
- `npm run check`: exit 0; **22 tes backend/147 assertion**, Pint, PHPStan tanpa error, ESLint, TypeScript frontend/E2E dan build lulus.
- `npm run test:e2e`: exit 0; **19 passed, 1 skipped, 5,4 menit**. Alur pelanggan sampai laporan serta operasional pegawai/error diuji pada desktop dan emulasi Pixel7. Skip hanya pengulangan matriks viewport pada proyek mobile; matriks lengkap sudah berjalan pada proyek desktop. Tidak ada tes yang diubah agar hasilnya lulus.
- Kedua tes dijalankan berurutan pada **lola_demo_test** dengan guard. Tidak mereset lola_demo atau menghapus volume.

103 paket npm dan 7 paket Composer khusus AI/transitif tidak terpakai dilepas, tanpa mengubah versi paket lain. Daftar 152 file source yang dibagikan dan 74 tautan relatif diperiksa; tidak ada file agent, `.env` aktual, database, runtime, dependency terpasang atau nilai rahasia lokal dalam kandidat publikasi. 134 file instruksi/config/arsip kerja, termasuk launcher Codex dan konfigurasi Playwright CLI agent, dikeluarkan dari Git dengan salinan lokal dipertahankan. Riwayat Git tidak ditulis ulang; commit lama tetap merupakan sejarah, bukan isi source utama saat ini.

## Pemeriksaan source bersih sebelum dibagikan

18 Oktober 2026: workflow GitHub pada commit `7c9d564` berhenti dengan `TS2688: Cannot find type definition file for 'node'` saat memeriksa konfigurasi TypeScript tes di root. Tes backend di run tersebut sudah lulus 22 tes/147 assertion, tetapi E2E belum berjalan karena langkah sebelumnya gagal.

Kegagalan tipe berhasil direproduksi dari snapshot file Git dalam folder sementara di luar proyek/fondasi, setelah `npm ci`. Root sekarang mendeklarasikan `@types/node` dan `typescript` secara langsung karena pemeriksaan tes root memakainya. Versi paket yang sudah ada tidak di-upgrade. Setelah lockfile baru dipasang pada salinan bersih, pemeriksaan tipe E2E, lint, pemeriksaan tipe frontend, serta build frontend lulus. Ini bukan klaim bootstrap penuh pada Windows baru atau komputer anggota.

Delapan file template yang tidak dirujuk aplikasi dihapus: halaman welcome/CSS/JS bawaan Laravel serta lima SVG bawaan Next.js. Bukti pembayaran demo, kode aplikasi dan tes dipertahankan. Jalur mencoba pada README melewati unduhan browser tes; panduan menjelaskan pemasangannya saat E2E diperlukan. Hasil workflow terbaru dapat diperiksa di [GitHub Actions](https://github.com/kheisarkc/demo-lolasport/actions/workflows/check.yml).

## Membaca hasil dan batasnya

Screenshot/laporan lokal berada di `.runtime/reports`, `playwright-report` dan `test-results`, diabaikan Git. Clone tidak membawa artefak komputer pembuat. Jangan memasukkan rahasia atau data nyata ke laporan.

Tes fungsi otomatis dan inspeksi visual berbeda dari tes kegunaan oleh manusia dan UAT pengelola. Belum mengklaim UAT, pengujian HP fisik/iOS/Firefox/WebKit, setup komputer anggota/Windows bersih, beban produksi atau audit independen. Hasil workflow GitHub Actions tidak dianggap lulus hanya karena file CI tersedia. Tidak ada deployment atau pembayaran nyata.
