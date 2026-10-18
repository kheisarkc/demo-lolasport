# Lola Sport API

Backend Laravel13/PHP8.4 dengan PostgreSQL. Aturan reservasi, otorisasi, pembayaran dan laporan berada di sini. Frontend Next.js tersedia pada apps/web dan berkomunikasi melalui proxy API.

Jalankan setup dan layanan dari [root monorepo](../../README.md), menggunakan launcher proyek agar PHP8.4 serta extension PostgreSQL yang sesuai terbaca. Dari root, `npm run api -- route:list` memperlihatkan route dan `npm run test:api` menjalankan tes pada database tes ber-guard.

## Peta kode

- [Route API](routes/api.php): endpoint autentikasi, booking, pembayaran, operasional dan laporan.
- [BookingService](app/Services/BookingService.php): transaksi, kunci, expiry, booking, pembayaran, review dan pembatalan.
- [BookingPolicy](app/Policies/BookingPolicy.php): peran dan kepemilikan data.
- [ReportController](app/Http/Controllers/ReportController.php): penerimaan approved menurut persetujuan WIB.
- [Migration](database/migrations) dan [seeder](database/seeders): struktur serta data contoh fiktif, bukan database pribadi.
- [Tes](tests): domain, kontrak, hak akses dan konkurensi PostgreSQL.

Baca [arsitektur dan alur lengkap](../../docs/ARSITEKTUR-DAN-ALUR.md). Tidak perlu tool atau akun AI untuk mengembangkan API. Gunakan data fiktif; pengujian hanya boleh membersihkan lola_demo_test, bukan lola_demo.
