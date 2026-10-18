# Setup dan isolasi teknis

Untuk clone baru dan pemula, mulai dari [panduan kelompok](PANDUAN-KELOMPOK.md). Dokumen ini menjelaskan konfigurasi teknis yang dipakai launcher.

## Konfigurasi default

- Compose project `lola-sport-demo`; volume `lola-sport-demo_lola_demo_postgres`.
- PostgreSQL `127.0.0.1:55433`; database operasional demo `lola_demo`, database tes `lola_demo_test`.
- Next.js `127.0.0.1:3001`; Laravel `127.0.0.1:8001`; origin/Sanctum mengikuti web dan cookie `lola_demo_session`.
- `npm run dev` menyalakan container, menjalankan migrasi tambahan dan seed idempoten, kemudian server. `npm run setup` menyiapkan database tanpa reset transaksi. `npm run db:stop` menghentikan container tanpa menghapus volume.

`scripts/bootstrap.ps1` memerlukan PowerShell 7, Node 22.16+, PHP 8.4, Composer Windows, Python 3.11+ dan Docker Desktop yang sudah siap. Ia memilih PHP di `C:\Tools\php84\php.exe` bila ada, lalu membuat php.ini proyek dengan extension PostgreSQL, memasang Composer/npm sesuai lockfile, Spec Kit dan Chromium lokal. Tidak menghubungkan dependency ke proyek induk. Bootstrap mesin baru dan OS lain belum diverifikasi langsung.

Rahasia dibuat lokal saat konfigurasi belum ada. File `.env`, `apps/api/.env`, `apps/api/.env.testing`, `apps/web/.env.local`, serta `.runtime` diabaikan Git. `.runtime/tools.json` menyimpan lokasi program komputer ini; jangan menyalinnya ke komputer anggota. Jangan menyalin password/APP_KEY teman. Source tidak mencakup database atau riwayat upload.

## Pengujian yang terisolasi

Backend TestCase berjalan sebelum RefreshDatabase dan memeriksa environment testing, pgsql, `lola_demo_test`, host `127.0.0.1`, port `55433` dan `current_database()`. Worker konkurensi memakai koneksi independen dengan guard. Migrasi/seed juga memiliki guard tujuan database.

`npm run test:e2e` memakai Next **3002**, API **8002**, `APP_ENV=e2e`, cookie `lola_demo_e2e_session`, storage `.runtime/e2e-storage`, dan build `.next-e2e`. Sebelum layanan tes, runner menjalankan `migrate:fresh --env=testing --seed` hanya pada database tes yang telah diverifikasi. CSRF diuji melalui HTTP nyata. Backend check dan E2E harus bergantian karena memakai database tes yang sama.

Port tes dapat dipilih sebelum menjalankan runner:

```powershell
$env:LOLA_E2E_WEB_PORT = '3003'
$env:LOLA_E2E_API_PORT = '8003'
npm run test:e2e
Remove-Item Env:LOLA_E2E_WEB_PORT, Env:LOLA_E2E_API_PORT
```

Pilih port yang kosong. Variabel ini khusus layanan tes; launcher/proxy/origin/Playwright mengikuti nilainya. Runner menolak port terpakai dan tidak mematikan proses lain.

Tes browser versi 001 sebelumnya menambah data fiktif pada `lola_demo` tanpa cleanup; itu riwayat pengujian versi lama. Runner versi 002 dan seterusnya hanya memakai `lola_demo_test`. Jangan menjalankan reset database operasional, `down -v`, atau menghapus volume sebagai cara memperbaiki tes.

## Mengubah port operasional

Default operasional masih eksplisit di beberapa file. Mengganti `.env` root saja tidak cukup: sesuaikan `compose.yaml`, API `.env`/`.env.testing`, `scripts/project.mjs`, guard `AppServiceProvider`/`TestCase`/worker, default Next, `.env.local`, origin Sanctum, health/CI dan dokumentasi. Jika nama database berubah, periksa SQL inisialisasi juga. Jangan mengganti nama/guard tes sembarangan. Untuk onboarding, pertahankan konfigurasi default bila tidak ada konflik.

## Tools pengembangan

MCP lokal memakai `scripts/boost-mcp.mjs` dan dependency Context7 proyek. Konfigurasi bukan bukti koneksi aktif; tidak perlu mengubah permission/trust global agar aplikasi berjalan. AI dan MCP opsional untuk memakai demo; bootstrap menyediakan tool pengembangan yang sudah menjadi bagian workflow repo. Detail: [TOOLS](TOOLS.md).
