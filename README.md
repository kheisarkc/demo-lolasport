# Lola Sport — demo reservasi lapangan

Demo lokal futsal/badminton untuk belajar dan diskusi kelompok capstone. Pelanggan memesan, pegawai mengelola jadwal serta memverifikasi pembayaran, dan pemilik membaca penerimaan pembayaran. Antarmuka berbahasa Indonesia dan memprioritaskan HP.

**Ini eksperimen pribadi berbantuan AI, belum menjadi hasil final kelompok atau UAT pengelola.** Harga, DP, tenggat, dan kebijakan pembatalan memakai [asumsi simulasi](docs/DEMO-ASSUMPTIONS.md). Tidak ada rekening/QR aktif, payment gateway, atau deployment publik.

## Mulai sesuai tujuan

- **Mau mencoba:** [Panduan kelompok — setup, akun, skenario, dan solusi kendala](docs/PANDUAN-KELOMPOK.md).
- **Mau memahami kode:** [Arsitektur dan perjalanan satu reservasi](docs/ARSITEKTUR-DAN-ALUR.md).
- **Mau mengubah:** [Panduan kontribusi, latihan kecil, Git, dan review](CONTRIBUTING.md).
- **Mau memeriksa hasil:** [Panduan dan hasil pengujian](docs/PENGUJIAN.md). Laporan lama bukan bukti pemeriksaan baru.

GitHub membagikan **source**, bukan aplikasi yang langsung berjalan di internet. Setiap anggota menjalankan salinan dan database sendiri; transaksi di komputer satu tidak otomatis muncul di komputer lain. Tidak perlu akun AI atau API key AI untuk memakai aplikasinya.

## Menjalankan di Windows

Siapkan Git, **PowerShell 7 (`pwsh`)**, Node.js **22.16+**, PHP **8.4**, Composer, dan Docker Desktop yang sudah berjalan dengan Linux containers. Panduan awal ini ditujukan untuk Windows; setup komputer baru dan macOS/Linux belum diverifikasi secara langsung. Lihat [langkah lengkap dan pengecekan prasyarat](docs/PANDUAN-KELOMPOK.md#1-siapkan-komputer).

```powershell
git clone https://github.com/kheisarkc/demo-lolasport.git
cd demo-lolasport
pwsh -File scripts/bootstrap.ps1
npm run dev
```

Bootstrap memasang dependency sesuai lockfile, membuat konfigurasi serta rahasia lokal, lalu menyiapkan database dan data contoh. Unduhan memerlukan internet. Gunakan folder baru, bukan menimpa proyek yang sudah ada. PHP XAMPP 8.2 tidak memenuhi lockfile; jika tersedia, bootstrap memilih `C:\Tools\php84\php.exe`.

Buka **http://127.0.0.1:3001**. Untuk pemakaian berikutnya cukup `npm run dev` dari root. `Ctrl+C` menghentikan server yang diluncurkan; `npm run db:stop` menghentikan database tanpa menghapus volume.

Jika sudah pernah clone versi lama, simpan perubahan sendiri dahulu, ambil pembaruan dengan `git pull --ff-only`, lalu jalankan ulang bootstrap saat lockfile/dependency berubah. Konfigurasi `.env` dan data demo yang sudah ada tidak di-reset. Jangan menyalin `node_modules` atau `vendor` antar komputer.

## Akun dan alur mencoba

Kata sandi ketiga akun: **`DemoLola2026!`**. Gunakan hanya data dan bukti fiktif.

- Pelanggan: `pelanggan@lola.test` — pilih jadwal, konfirmasi, kirim bukti DP/pelunasan, lihat reservasi sendiri.
- Pegawai: `pegawai@lola.test` — agenda, walk-in, blok pemeliharaan, verifikasi, tunai, dan master lapangan.
- Pemilik: `pemilik@lola.test` — laporan pembayaran approved menurut tanggal persetujuan WIB.

Coba **pelanggan → reservasi futsal Rp150.000 → bukti DP Rp75.000 → pegawai setujui → pelunasan Rp75.000 → pegawai setujui → pemilik cocokkan kenaikan Rp150.000**. Bukti fiktif PNG dapat diunduh dari formulir pembayaran; mengunggah bukti belum menambah penerimaan. [Langkah lengkap dan skenario tambahan](docs/PANDUAN-KELOMPOK.md#3-coba-alur-utama).

## Struktur dan pemeriksaan

- `apps/web`: Next.js 16, React, TypeScript; halaman dan proxy.
- `apps/api`: Laravel 13, PHP 8.4, Sanctum; aturan, otorisasi, transaksi, dan data.
- `compose.yaml`: PostgreSQL 17 lokal.
- `apps/api/database`: migration dan seeder untuk membuat struktur serta data contoh; bukan salinan database pribadi.
- `tests/e2e` dan `.github/workflows`: tes browser dan pemeriksaan CI otomatis.
- `scripts`: bootstrap dan launcher aplikasi.
- `docs/PROJECT.md`: kebutuhan dan batas aplikasi.
- `docs`: panduan, keputusan, asumsi, dan status. [Peta file lebih lengkap](docs/ARSITEKTUR-DAN-ALUR.md).

```powershell
npm run doctor
npm run check
npm run test:e2e
```

Jalankan `check` dan E2E **bergantian**. Keduanya menggunakan database tes yang boleh dibersihkan runner, **`lola_demo_test`**, dengan guard sebelum cleanup. E2E memakai layanan 3002/8002; aplikasi demo memakai 3001/8001 dan `lola_demo`. Jangan menjalankan perintah reset database operasional.

Rahasia `.env`, dependency, database, unggahan, dan screenshot lokal tidak masuk Git. Clone baru mendapat akun/lapangan dari seeder, bukan riwayat transaksi komputer pembuat. Screenshot historis hanya ada pada komputer yang membuatnya. [Detail isolasi](docs/SETUP.md).

## Batas penggunaan

Belum UAT pengelola, belum siap produksi, dan tidak ada pembayaran nyata. Pengujian lokal tidak membuktikan instalasi semua komputer, kegunaan oleh manusia, atau kesiapan beban produksi. Publikasi source bukan deployment aplikasi.

## Apa yang masuk Git?

Repo menyimpan source aplikasi, migration/seeder, tes, CI, manifest/lockfile, konfigurasi proyek dan panduan kelompok. File `.env.example` adalah **template tanpa rahasia aktif**, bukan `.env` komputer pembuat. Bootstrap membuat `.env` dan APP_KEY/password lokal masing-masing anggota.

`.env` aktual, database/volume, upload, log, build, dependency terpasang, serta konfigurasi/skill/instruksi agent AI tidak ikut source terbaru. Tidak perlu Python, Codex, Spec Kit, MCP, atau akun AI untuk setup dan mengembangkan aplikasi ini.
