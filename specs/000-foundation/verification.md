# Hasil verifikasi fondasi

Arsip dari snapshot source fondasi c628fdc. Daftar berikut bukan hasil pengujian salinan demo. Hasil demo dicatat terpisah pada specs/001-demo/verification.md.

Tanggal: 18 Oktober 2026, Asia/Jakarta.

## Lulus
- `npm run check`: Pint, empat tes backend dengan sepuluh assertion, Larastan tanpa error, ESLint, TypeScript, dan build Next.js.
- `npm run test:e2e`: empat skenario Playwright lulus pada proyek desktop Chromium dan mobile Chromium. Skenario mencakup request kesehatan lintas layanan serta keterbacaan halaman/tanpa overflow horizontal.
- `composer validate --no-check-publish`: composer.json dan composer.lock valid.
- Audit npm sesudah penggantian linter: nol temuan pada pemeriksaan setup.
- Docker PostgreSQL sehat; lola_sport dan lola_sport_test terdaftar terpisah.
- Tes backend memeriksa koneksi PostgreSQL aktual dan respons 503 tanpa membocorkan detail exception.
- Codex login status: sudah masuk menggunakan ChatGPT; tidak membuat API key atau akun baru.
- MCP Boost dan Context7: handshake, daftar tools, serta satu pemanggilan tool aktual masing-masing berhasil.
- Playwright CLI: halaman awal, snapshot, screenshot desktop, dan tautan /api/health berhasil diperiksa.
- Sintaks bootstrap.ps1 dan dua launcher Node valid.
- Jalur check final menyiapkan PostgreSQL bila diperlukan; pemeriksaan lengkap sesudah perubahan launcher tersebut kembali lulus.

## Temuan yang diperbaiki
- PATH/Path Windows pada objek environment launcher diselaraskan agar subprocess npm dapat menemukan Node.
- Dependency lint default yang terkena advisory diganti tanpa menurunkan atau mengganti Next.js.
- Browser test runner dipasang berdasarkan versi @playwright/test yang tepat; CLI dan test runner memiliki browser versi tersendiri.
- Composer lockfile diselaraskan dengan metadata dan persyaratan PHP final.

## Batas pemeriksaan
- GitHub Actions baru disiapkan sebagai file workflow; belum dijalankan di GitHub karena tidak ada remote/push.
- Bootstrap di mesin Windows yang benar-benar bersih belum diuji; runtime pada mesin ini sudah diverifikasi.
- Launcher Codex diperiksa sintaks, opsi CLI, login, dan konteks MCP-nya. Belum menjalankan tugas pengembangan AI semalaman.
- Tidak ada fitur reservasi, pembayaran, laporan bisnis, autentikasi UI, UAT pengguna, atau deployment yang dinyatakan lulus.
- Pada browser preview muncul warning hidrasi saat HTML mendapat atribut tambahan `bis_skin_checked`/`bis_register` yang tidak ada di source aplikasi. Sesi Playwright terisolasi tidak mencatat warning tersebut; tidak ditambahkan suppressHydrationWarning untuk menutupinya.
