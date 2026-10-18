# Implementation Plan: Panduan dan publikasi kelompok

## Scope / technical context
Source saat mulai bersih pada 8b41986. Remote origin mengarah ke kheisarkc/demo-lolasport; fetch aktual menunjukkan main masih d8b230c, leluhur HEAD. Laravel/Next/PostgreSQL dan runtime tetap. Tidak ada dependency, migrasi, atau perubahan aplikasi.

## Constitution check
Pengguna mengizinkan push source dan panduan. Pertahankan isolasi, rahasia lokal, riwayat awal, serta batas nonproduksi. Tidak ada extension hooks yang terdaftar.

## Design
- README menjadi pintu masuk dengan clone, prasyarat, akun dan jalur belajar.
- docs/PANDUAN-KELOMPOK.md memandu pemasangan Windows, skenario, pemeriksaan dan troubleshooting.
- docs/ARSITEKTUR-DAN-ALUR.md menghubungkan proses, folder, domain dan tes.
- CONTRIBUTING.md mengatur latihan kecil, branch, review dan integrasi tiga anggota sebagai usulan.
- docs/SETUP.md dan START-HERE.md diselaraskan dengan runner aktual; DECISIONS/STATE mencatat izin publikasi baru.

## Verification and delivery
Periksa tautan relatif, kecocokan nama perintah/variabel, diff dan seluruh kandidat publikasi/riwayat terhadap rahasia dan artefak lokal. Jalankan check dan E2E secara berurutan pada database tes dengan guard. Catat hasil baru dan keterbatasan; commit lalu push HEAD ke main hanya bila fast-forward. Verifikasi remote setelah push. Jangan klaim setup mesin anggota telah diuji.
