# Status demo Lola Sport

18 Oktober 2026: **redesign mobile 002 selesai diimplementasikan dan diverifikasi lokal**, langsung pada repo demo yang sama. Ini eksperimen pribadi, belum UAT pengelola dan bukan sistem produksi.

## Hasil yang tersedia

- UI terang dengan identitas hijau lapangan, navigasi URL App Router, bottom navigation HP/sidebar desktop, angka tabular, fokus, safe area, dan reduced motion.
- Pelanggan: katalog/strip tanggal/slot berlabel harga-status, sticky summary, pilihan terjaga melalui login, checkout dengan pemeriksaan ulang, detail URL, mendatang/riwayat, preview bukti privat, countdown server, serta pembayaran/pembatalan terkonfirmasi.
- Pegawai: dashboard data nyata, agenda per lapangan, walk-in/blok terfokus, antrean terpisah, preview/perbesar/verifikasi bukti, tunai terkonfirmasi, dan daftar master dengan editor tunggal.
- Pemilik: periode cepat/custom, total approved dan komponen DP/pelunasan/bayar penuh, kartu transaksi HP, tabel desktop, dan pagination.
- Backend hanya mendapat tambahan kontrak status slot, jam server, kategori laporan, serta guard E2E. Aturan bisnis, peran, PostgreSQL, Sanctum, dan isolasi demo dipertahankan.
- Aplikasi: `http://127.0.0.1:3001`, API 8001. Jalankan `npm run dev` jika server berhenti. Akun dan langkah mencoba tersedia di README.

## Bukti final

- `npm run check`: exit 0; Pint, 22 tes backend/147 assertion, PHPStan tanpa error, ESLint, TypeScript frontend dan E2E, serta build seluruh route lulus.
- `npm run test:e2e`: exit 0; **19 passed, 1 skipped, 5,2 menit**. Skip hanya pengulangan matriks pada proyek Pixel 7. Matriks 320/360/390/393/430/1280 px, viewport pendek dan form panjang sudah dijalankan lengkap sekali.
- Alur pelanggan → DP → persetujuan pegawai → pelunasan → pemilik menghasilkan kenaikan tepat Rp150.000 dan dua pembayaran. Walk-in, blok, tunai, batal, tambah/edit master, rejection, auth/CSRF, konflik slot, double tap, pemulihan error, Back/refresh/direct URL dan rekonsiliasi diuji.
- Dua belas screenshot before serta enam area after mobile/desktop dan tambahan 320 px diperiksa di `.runtime/reports/redesign/{before,after}/`. Pemeriksaan read-only pada 3001 juga berhasil tanpa pageerror; artefak di `local-demo/`.
- E2E memakai layanan 3002/8002 dan **lola_demo_test**, dengan guard sebelum cleanup. Build, storage, cookie dan bukti terpisah. `lola_demo` tidak di-reset atau diisi oleh E2E redesign. Jangan menjalankan backend check dan E2E bersamaan.
- Kandidat Git diperiksa terhadap rahasia lokal dan artefak terlarang. Laporan rinci: `specs/002-mobile-redesign/verification.md`.

## Checkpoint dan perbaikan

- Baseline `09e84d0` diperiksa sebelum edit; Git bersih dan proses 3001/8001 terbukti dari folder demo. Before mengonfirmasi hero pegawai, ringkasan HP y=1419 px, input 13 px, empat form master, dan detail URL `/`.
- Spec Kit 002, riset dokumentasi Next.js lokal, dan arah desain disimpan. Satu agent melakukan riset read-only; tidak ada repo eksternal atau dependency baru. Kontrak API diuji red/green, lalu tiga alur utama mobile dibangun dan diperiksa.
- Inspeksi memperbaiki tab lapangan, overlay tindakan, label/hint, urutan bukti/angka, readiness screenshot, serta penanda tanggal pilihan.
- Runner E2E memakai build/start terpisah. Origin Sanctum, locator alert, wait Back, fixture penerimaan, import helper, typecheck tes, dan pemulihan error auth diperbaiki. Trace Windows terkunci EBUSY diatasi dengan menonaktifkan trace lokal; assertion dan screenshot tetap. Putaran final lulus.

## Batas dan langkah aman

- Tidak ada implementasi dalam cakupan redesign yang masih terbuka. Lanjutkan mencoba URL dan akun README; tidak perlu reset/setup ulang.
- Belum diuji pada HP fisik, keyboard iOS, Firefox/WebKit, GitHub Actions, beban produksi, atau audit independen. Tidak mengklaim sertifikasi WCAG, UAT, atau persetujuan kebijakan pengelola.
- Aturan simulasi tetap `docs/DEMO-ASSUMPTIONS.md`. Bukti 001 adalah riwayat versi sebelumnya; bukti redesign ada di 002. Tidak ada push, deployment, perubahan global, atau perubahan fondasi induk.
- Source fondasi awal berasal dari snapshot `c628fdc533e0832c7b98d3a0739056073175cc9d`; riwayat GitHub awal `d8b230c` dipertahankan. Pengecualian lokal folder demo pada repo induk sudah ada sebelum tugas ini.
