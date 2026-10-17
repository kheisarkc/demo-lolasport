# Verifikasi demo Lola Sport

18 Oktober 2026. Windows lokal, PHP 8.4.26, Node 22.16.0, Laravel 13.37.0, Sanctum 4.3.3, Next.js 16.4.2, PostgreSQL 17, Playwright Test 1.64.1. Ini pengujian teknis otomatis dan inspeksi screenshot oleh agen, bukan UAT pengelola.

## Perintah dan hasil

- `pwsh -File scripts/bootstrap.ps1`: berhasil memasang dependency terpisah sesuai lockfile, runtime PHP proyek, Spec Kit dan Chromium; menyiapkan database, migrasi dan seed demo. Tidak menghubungkan dependency ke fondasi.
- `npm run doctor`: lulus. PHP 8.4.26 dengan pdo_pgsql, Node 22.16.0, workflow/dependency tersedia, container PostgreSQL sehat pada 127.0.0.1:55433.
- `npm run check`: lulus pada putaran terakhir. Pint passed; Pest 20/20, 127 assertion; PHPStan 0 error; ESLint, `next typegen && tsc --noEmit`, dan `next build` berhasil. Halaman utama dinamis agar tanggal tidak membeku saat build.
- `npm run test:e2e`: 10/10 lulus pada putaran terakhir, 2,2 menit. Lima skenario masing-masing pada Chromium desktop dan emulasi Pixel 7. `npm run test:e2e -- tests/e2e/foundation.spec.ts` juga lulus 4/4 saat memeriksa launcher mandiri.
- Composer `validate --no-check-publish --working-dir=apps/api` melalui PHP 8.4 proyek: `./composer.json is valid`.
- `node scripts/capture-demo.mjs`: berhasil menghasilkan PNG bukti fiktif dan screenshot katalog desktop/mobile. PNG UI benar-benar diunduh lalu diunggah kembali pada E2E terakhir.
- Kandidat Git diperiksa terhadap nilai rahasia `.env` lokal dan artefak terlarang: tidak ditemukan. Konfigurasi aktif tidak merujuk port/database fondasi. Status tracked repo induk bersih.

## Perilaku backend

20 tes mencakup 12 tes domain/otorisasi, empat tes konkurensi, dua tes health/database dan dua tes scaffold bawaan. Hasil scaffold bukan pengganti tes domain.

- Batas akses pelanggan/pegawai/pemilik; pelanggan lain tidak dapat membaca detail/bukti; register tidak bisa menyuntikkan role; normalisasi email sebelum pemeriksaan unik.
- Booking masa lalu, jam tidak valid, overlap dan slot bersebelahan; constraint exclusion PostgreSQL diuji langsung melewati pemeriksaan aplikasi.
- Hold kedaluwarsa termasuk tepat tenggat; bukti tepat waktu mempertahankan slot. DP dibulatkan ke atas dengan integer rupiah.
- DP/pelunasan diterima sekali; nominal kurang/berlebih ditolak; pelanggan tidak dapat mencatat tunai; pembatalan mencegah pembayaran lanjutan.
- Penolakan wajib beralasan; penolakan awal melepas slot, penolakan pelunasan mempertahankan confirmed. Validasi file dan akses bukti privat.
- Harga transaksi tetap saat master berubah; jam/nonaktif tidak boleh merusak booking; blok pemeliharaan mencegah bentrok.
- Pembatalan hanya sebelum mulai. Pembayaran approved tetap di laporan meski booking dibatalkan tanpa refund.
- Filter laporan memakai waktu persetujuan dan batas tanggal/bulan Asia/Jakarta. Total/rincian/agregat memakai pembayaran approved yang sama; pending/rejected tidak dihitung.

Empat tes konkurensi menjalankan dua proses PHP independen dengan koneksi/transaksi PostgreSQL masing-masing: booking slot sama, persetujuan pembayaran sama, tunai yang berpotensi berlebih, serta cancel melawan approve. Booking bersamaan menghasilkan tepat satu keberhasilan; approval ganda tidak menggandakan penerimaan/audit; total tunai tidak berlebih; cancel/approve menghasilkan keadaan konsisten. Ini pengujian konkurensi service/database, bukan uji beban HTTP produksi.

Guard TestCase berjalan sebelum RefreshDatabase; memeriksa environment testing, pgsql, host 127.0.0.1, port 55433, nama `lola_demo_test` dan `current_database()`. Worker juga memeriksa tujuan database. Migrasi/seed operasional hanya pada database demo terverifikasi. Database operasional tidak di-reset.

## Browser dan rekonsiliasi

Pada kedua viewport:

1. Pemilik membaca baseline penerimaan; pelanggan membuat booking futsal Rp150.000 pada slot database tersedia.
2. Pelanggan mengunduh PNG fiktif dari UI lalu mengirim DP Rp75.000. Nilai diterima masih Rp0 saat menunggu verifikasi.
3. Pegawai menyetujui DP, status confirmed, bukti privat dapat diunduh dengan sesi berwenang.
4. Pelanggan mengirim pelunasan Rp75.000 melalui QRIS demo; pegawai menyetujui, UI menunjukkan lunas.
5. Pemilik melihat selisih tepat Rp150.000 dari baseline dan dua baris pembayaran booking tersebut. Tidak ada pageerror selama alur ini.
6. Registrasi, persistensi sesi setelah reload, logout, penolakan `/me` setelah logout dan CSRF diuji melalui HTTP. Kasus negatif login menggunakan Origin tepercaya tanpa token/Fetch Metadata menghasilkan 419. Laravel 13 dapat menerima request same-origin melalui Fetch Metadata.
7. Pegawai membuat walk-in, menerima tunai, membatalkan sebelum mulai dan menyimpan master. Katalog/health dan ketiadaan overflow horizontal dokumen diperiksa.

E2E memakai data fiktif pada `lola_demo`, tanpa penghapusan. Kenaikan penerimaan dihitung relatif baseline. Rerun berulang mengisi slot; pilih tanggal/slot baru jika tanggal uji akhirnya penuh.

## Inspeksi visual

Screenshot katalog desktop/mobile, detail DP pelanggan, verifikasi pegawai, master dan penerimaan pemilik diperiksa. Tombol, nominal, penanda demo dan susunan mobile terbaca. Tabel laporan HP memakai scroll horizontal di dalam kontainer.

Artefak lokal yang diabaikan Git:
- `.runtime/reports/catalog-desktop.png` dan `catalog-mobile.png`.
- `.runtime/reports/mobile-customer-dp.png`, `mobile-staff-verified.png`, `mobile-staff-master.png`, `mobile-owner-receipts.png`.
- `test-results/` memuat screenshot tiap skenario/viewport; diperbarui Playwright setiap run.

## Temuan dan batas

Putaran awal E2E 7/10: dua assertion tidak menerima spasi locale Rp0 dan satu timeout 5 detik ketika respons dev masih berlangsung. Assertion diperbaiki tetap memeriksa nol; timeout menjadi 15 detik. Putaran ulang lulus. Capture awal gagal mencari Chromium global; lokasi runtime diatur sebelum impor Playwright, lalu berhasil. Default port/database scaffold diselaraskan dan pemeriksaan diulang.

Belum dijalankan: HP fisik, Firefox/WebKit, bootstrap mesin baru, GitHub Actions, uji beban produksi, audit keamanan independen. Bootstrap berhasil di komputer ini dengan program prapasang, bukan bukti portabilitas ke setiap komputer. MCP demo belum dimuat ulang; instruksi/dokumentasi versi lokal dan CLI dipakai sebagai fallback.

Tidak ada pembayaran nyata, rekening/QR aktif, gateway, push, deployment atau akses produksi. Aturan DP/hold/pembatalan tanpa refund/basis laporan adalah asumsi sementara yang diizinkan untuk simulasi; belum divalidasi pengelola. UAT pengelola belum dilakukan.
