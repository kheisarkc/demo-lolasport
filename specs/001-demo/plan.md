# Implementation Plan: Demo Lola Sport
## Summary
Laravel 13.37/PHP 8.4/Sanctum 4.3, Next.js App Router TypeScript, PostgreSQL 17. Source snapshot fondasi, Git/runtime/demo mandiri.
## Technical Context
Docker lola-sport-demo, volume lola_demo_postgres, 55433 lola_demo/lola_demo_test; web 3001/API 8001; cookie lola_demo_session, CSRF dan Next rewrites.
Court row lock → booking → payment untuk setiap mutasi/expiry/master. Exclusion GiST btree_gist rentang [start,end) untuk overlap aktif. Uang integer, harga/DP snapshot. Timestamp UTC, input/laporan WIB eksplisit.
Private upload MIME/size + authorized download. Seed idempoten, guard DB sebelum migrasi/seed/tes. Tanpa reset data operasional.
## Constitution Check
Stack tetap. Aturan demo diizinkan pengguna, bukan validasi pengelola. Tidak ada extension hooks. Satu workflow Spec Kit.
## Structure
apps/api models, BookingService, auth/court/booking/payment/report controllers, policies, migrations, Pest. apps/web client dashboard berbasis peran. tests/e2e desktop/mobile dan concurrency dua proses di DB tes.
## Design direction
Biru #1559a7, hijau #26755b, putih #f6f8fa, tinta #142b40, oranye #ed8c36; Segoe UI; garis lapangan CSS, jadwal tombol jam, summary booking samping desktop/bertumpuk HP. Daftar operasional mudah dipindai tanpa aset eksternal wajib.
## Delivery
US1 → US2 → US3, tes tiap tahap, check penuh, E2E, screenshot, diff/secret review, README/status. Tidak push/deploy.
