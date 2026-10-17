# Setup dan isolasi

`npm run dev` dari root demo menjalankan PostgreSQL Compose lola-sport-demo, migrasi tambahan, seed idempoten, Laravel 8001 dan Next 3001 pada loopback. Dependency baru: `pwsh -File scripts/bootstrap.ps1`.

`scripts/bootstrap.ps1` memilih PHP 8.4 di C:\Tools\php84, membuat php.ini proyek dengan pdo_pgsql/pgsql, memasang Composer/npm dari lockfile, Spec Kit lokal dan Chromium di .runtime. Tidak menghubungkan vendor/node_modules ke induk.

`npm run setup` hanya migrasi tambahan/seed tanpa reset. `npm run db:stop` stop container, tidak menghapus volume. Jangan menjalankan `migrate:fresh`, down -v atau menghapus data demo operasional.

Konfigurasi lokal di `.env`, `apps/api/.env`, `.env.testing` dan `apps/web/.env.local`; semuanya diabaikan Git. Jangan mencetak rahasia di laporan. `.runtime/tools.json` menunjukkan program terpasang yang dipakai dan `.runtime/php.ini` menentukan extension PHP proyek.

Tes backend memeriksa testing+pgsql+lola_demo_test+127.0.0.1+55433+current_database sebelum RefreshDatabase. Migrate/seed mempunyai guard database demo juga. Tes konkurensi memakai koneksi/proses mandiri dan hanya database tes. E2E membuat data fiktif baru pada lola_demo, tanpa cleanup destruktif.

Jika port terpakai, launcher menolak menghentikan proses lain. Pilih port kosong dan ubah secara konsisten compose/root .env, API .env/.env.testing, scripts/project.mjs, AppServiceProvider guard, TestCase/worker guards, SQL/init jika nama DB berubah, Next .env.local/defaults, Sanctum origin, Playwright, health/CI/dokumen. Jangan hanya mengganti .env karena default dan guard sengaja eksplisit.

MCP lokal dijalankan dari folder demo melalui scripts/boost-mcp.mjs dan dependency Context7 demo. Tidak ada trust/global permission yang diubah. Hasil tools fondasi tidak membuktikan MCP demo aktif pada sesi yang sama.
