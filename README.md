# demo-lolasport

Demo pribadi Lola Sport: Laravel 13 + Next.js 16 + PostgreSQL 17. Reservasi futsal/badminton, akun pelanggan/pegawai/pemilik, walk-in, jadwal pemeliharaan, pembayaran manual fiktif, verifikasi dan laporan penerimaan. Antarmuka Indonesia, desktop dan HP.

## Menjalankan

Dependency dan konfigurasi lokal sudah disiapkan pada komputer ini. Dari folder demo:

```powershell
npm run dev
```

Buka **http://127.0.0.1:3001**. Laravel health: http://127.0.0.1:8001/api/v1/health. Docker Desktop harus berjalan. Perintah menyalakan database demo, migrasi tambahan, seed idempoten dan kedua server. Ctrl+C menghentikan server yang diluncurkannya. `npm run db:stop` menghentikan container demo tanpa menghapus volume.

Untuk checkout baru di Windows dengan Node 22+, PHP 8.4, Composer, Python 3.11+ dan Docker terpasang:

```powershell
pwsh -File scripts/bootstrap.ps1
npm run dev
```

Bootstrap memasang dependency sesuai lockfile pada proyek ini. PHP 8.4 dipilih dari `C:\Tools\php84\php.exe` bila tersedia; PHP XAMPP 8.2 tidak memenuhi persyaratan. Tidak perlu mengubah PATH/global permissions. Jika port terpakai, launcher berhenti tanpa mematikan proses lain; lihat docs/SETUP.md.

## Akun fiktif

Kata sandi ketiga akun: **`DemoLola2026!`**.

- Pelanggan: `pelanggan@lola.test`
- Pegawai: `pegawai@lola.test`
- Pemilik: `pemilik@lola.test`

Data registrasi tambahan harus fiktif. Akun contoh ini hanya untuk demo lokal.

## Mencoba alur lengkap

1. Masuk sebagai pelanggan, pilih tanggal mendatang dan jam tersedia, lalu buat reservasi. Lihat tenggat hold dan minimum DP pada detail.
2. Pilih transfer/QRIS demo, masukkan DP atau total, unggah bukti fiktif PNG/JPG/PDF maksimal 2 MB. Tidak ada rekening/QR aktif atau payment gateway. Bukti belum dihitung sebagai penerimaan.
3. Keluar dan masuk sebagai pegawai. Buka **Reservasi & verifikasi**, pilih detail, unduh bukti, lalu setujui atau tolak dengan alasan. DP diterima mengonfirmasi reservasi.
4. Pelanggan mengajukan pelunasan tepat sisa tagihan; pegawai menyetujuinya. Pegawai juga dapat mencatat tunai, walk-in dan blok pemeliharaan melalui **Jadwal & walk-in**.
5. Pemilik membuka **Penerimaan pembayaran**, memilih tanggal persetujuan WIB, lalu mencocokkan total dengan rincian. DP dan pelunasan masuk masing-masing sekali. Pembatalan tanpa refund tetap masuk penerimaan.

Pegawai mengubah master pada **Kelola lapangan**. Harga lama tersimpan pada transaksi. Perubahan jam/nonaktif yang mematahkan booking aktif akan ditolak. Pembatalan hanya sebelum mulai, tanpa refund/pindah jadwal pada simulasi ini.

## Isolasi dan verifikasi

Compose project `lola-sport-demo`, volume `lola-sport-demo_lola_demo_postgres`, PostgreSQL loopback `127.0.0.1:55433`, database `lola_demo` dan `lola_demo_test`. Sesi `lola_demo_session`, origin web `127.0.0.1:3001`, rahasia lokal baru. Seluruh `.env`, runtime, bukti upload dan hasil tes diabaikan Git.

```powershell
npm run doctor
npm run check
npm run test:e2e
```

`check` mencakup Pint, Pest/PostgreSQL termasuk dua proses konkurensi, PHPStan, ESLint, TypeScript dan build. E2E memakai Chromium desktop/Pixel 7, akun serta transaksi fiktif baru tanpa reset database demo. Tes backend hanya boleh membersihkan `lola_demo_test`; guard memeriksa nama, host, port dan koneksi sebelum pembersihan. Jangan menjalankan reset database operasional.

Spec/plan/tasks: `specs/001-demo/`. Asumsi: `docs/DEMO-ASSUMPTIONS.md`. Hasil aktual dan keterbatasan: `specs/001-demo/verification.md` serta `docs/STATE.md`. Riwayat awal README GitHub dipertahankan dalam commit d8b230c. Fondasi diambil dari snapshot Git; repo induk hanya diberi pengecualian lokal untuk folder demo.

Ini eksperimen lokal dengan aturan simulasi sementara. Belum UAT pengelola dan belum siap produksi. Tidak ada push atau deployment.
