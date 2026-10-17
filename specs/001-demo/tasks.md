# Tasks: Demo Lola Sport
## Setup
- [x] T001 Clone dan snapshot source, isolasi compose.yaml, scripts/project.mjs dan test guard.
- [x] T002 Dependency mandiri dan runtime melalui scripts/bootstrap.ps1; cek koneksi DB demo.
## Foundation
- [x] T003 Model/migrasi constraint dan seed fiktif apps/api/database; guard runtime.
## US1 Pelanggan
- [x] T004 [US1] Tes perilaku auth/ownership/booking/expiry di apps/api/tests/Feature/DemoTest.php.
- [x] T005 [US1] Implementasi auth/policy/BookingService di apps/api/app.
- [x] T006 [US1] Katalog/login/booking/detail/pembayaran di apps/web/src/app.
## US2 Pegawai
- [x] T007 [US2] Tes master/block/payment/cancel/concurrency di apps/api/tests.
- [x] T008 [US2] Master, blok, walk-in, verifikasi/tunai dan audit di apps/api/app.
- [x] T009 [US2] Antarmuka operasional di apps/web/src/app.
## US3 Pemilik
- [x] T010 [US3] Tes rekonsiliasi dan batas WIB di apps/api/tests/Feature/DemoTest.php.
- [x] T011 [US3] ReportController dan laporan apps/web/src/app.
## Verification & Delivery
- [x] T012 Browser desktop/mobile/CSRF/screenshot tests/e2e/demo.spec.ts.
- [x] T013 Jalankan check/build/e2e, perbaiki temuan dan catat specs/001-demo/verification.md.
- [x] T014 Review diff/secret, README satu perintah, akun dan docs/STATE.md final.

Dependencies: T001→T002→T003→US1→US2→US3→T012→T013→T014. Tes dibuat sebelum implementasi terkait. Riset read-only dapat paralel; source dikerjakan satu agent. Semua story diperlukan sebelum delivery, bukan berhenti pada MVP.
