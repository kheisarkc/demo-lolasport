# Rencana teknis fondasi

- Monorepo Laravel API dan Next.js App Router.
- PostgreSQL 17 melalui Docker lokal, database pengembangan/test terpisah.
- Root launcher menerapkan konfigurasi PHP proyek dan menjalankan pemeriksaan.
- API health membuktikan koneksi PostgreSQL; route health Next.js memeriksa API server-side.
- Pest/PHPUnit, Pint, Larastan, ESLint, TypeScript, build, dan Playwright menjadi jalur pemeriksaan.
- Spec Kit dan skill pendukung disimpan pada repo; Boost dan Context7 melalui MCP khusus proyek.
- Tidak ada autentikasi bisnis, reservasi, pembayaran, atau deployment yang dianggap selesai oleh fondasi ini.
