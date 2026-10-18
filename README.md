# Lola Sport — demo reservasi lapangan

Demo lokal futsal/badminton untuk belajar dan diskusi kelompok capstone. Pelanggan memesan, pegawai mengelola jadwal serta memverifikasi pembayaran, dan pemilik membaca penerimaan pembayaran. Antarmuka berbahasa Indonesia dan memprioritaskan HP.

**Ini eksperimen pribadi berbantuan AI, belum menjadi hasil final kelompok atau UAT pengelola.** Harga, DP, tenggat, dan kebijakan pembatalan memakai [asumsi simulasi](docs/DEMO-ASSUMPTIONS.md). Tidak ada rekening/QR aktif, payment gateway, atau deployment publik.

## Mulai sesuai tujuan

- **Mau mencoba:** [Panduan kelompok — setup, akun, skenario, dan solusi kendala](docs/PANDUAN-KELOMPOK.md).
- **Mau memahami kode:** [Arsitektur dan perjalanan satu reservasi](docs/ARSITEKTUR-DAN-ALUR.md).
- **Mau mengubah:** [Panduan kontribusi, latihan kecil, Git, dan review](CONTRIBUTING.md).
- **Mau melihat bukti:** [Status](docs/STATE.md), [verifikasi UI 002](specs/002-mobile-redesign/verification.md), dan [penyerahan 003](specs/003-team-handoff/verification.md). Laporan lama bukan bukti pemeriksaan baru.

GitHub membagikan **source**, bukan aplikasi yang langsung berjalan di internet. Setiap anggota menjalankan salinan dan database sendiri; transaksi di komputer satu tidak otomatis muncul di komputer lain. Tidak perlu akun AI atau API key AI untuk memakai aplikasinya.

## Menjalankan di Windows

Siapkan Git, **PowerShell 7 (`pwsh`)**, Node.js **22.16+**, PHP **8.4**, Composer, Python **3.11+**, dan Docker Desktop yang sudah berjalan dengan Linux containers. Panduan awal ini ditujukan untuk Windows; setup komputer baru dan macOS/Linux belum diverifikasi secara langsung. Lihat [langkah lengkap dan pengecekan prasyarat](docs/PANDUAN-KELOMPOK.md#1-siapkan-komputer).

```powershell
git clone https://github.com/kheisarkc/demo-lolasport.git
cd demo-lolasport
pwsh -File scripts/bootstrap.ps1
npm run dev
```

Bootstrap memasang dependency sesuai lockfile, membuat konfigurasi serta rahasia lokal, lalu menyiapkan database dan data contoh. Unduhan memerlukan internet. Gunakan folder baru, bukan menimpa proyek yang sudah ada. PHP XAMPP 8.2 tidak memenuhi lockfile; jika tersedia, bootstrap memilih `C:\Tools\php84\php.exe`.

Buka **http://127.0.0.1:3001**. Untuk pemakaian berikutnya cukup `npm run dev` dari root. `Ctrl+C` menghentikan server yang diluncurkan; `npm run db:stop` menghentikan database tanpa menghapus volume.

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
- `specs/000-foundation`, `001-demo`, `002-mobile-redesign`, `003-team-handoff`: kebutuhan, rencana, tugas, dan bukti menurut tahap.
- `docs`: panduan, keputusan, asumsi, dan status. [Peta file lebih lengkap](docs/ARSITEKTUR-DAN-ALUR.md).

```powershell
npm run doctor
npm run check
npm run test:e2e
```

Jalankan `check` dan E2E **bergantian**. Keduanya menggunakan database tes yang boleh dibersihkan runner, **`lola_demo_test`**, dengan guard sebelum cleanup. E2E memakai layanan 3002/8002; aplikasi demo memakai 3001/8001 dan `lola_demo`. Jangan menjalankan perintah reset database operasional.

Rahasia `.env`, dependency, database, unggahan, dan screenshot lokal tidak masuk Git. Clone baru mendapat akun/lapangan dari seeder, bukan riwayat transaksi komputer pembuat. Screenshot historis hanya ada pada komputer yang membuatnya. [Detail isolasi](docs/SETUP.md).

## Batas penggunaan

Belum UAT pengelola, belum siap produksi, dan tidak ada pembayaran nyata. Pengujian lokal tidak membuktikan instalasi semua komputer, kegunaan oleh manusia, atau kesiapan beban produksi. Source fondasi berasal dari snapshot `c628fdc`; riwayat awal repo `d8b230c` dipertahankan. Publikasi source ke repo ini diizinkan pengguna pada tahap 003; publikasi source bukan deployment aplikasi.
