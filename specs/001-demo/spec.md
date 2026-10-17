# Feature Specification: Demo Lola Sport

**Feature Branch**: codex/001-demo
**Created**: 2026-10-18
**Status**: Diizinkan pengguna untuk implementasi lokal.

## User Scenarios & Testing
### US1 Pelanggan memesan dan membayar (P1)
Pilih lapangan/tanggal/jam, daftar/login, reservasi, riwayat pribadi, bukti DP/pelunasan dan pembatalan sebelum mulai.
Acceptance: dua pesanan bersamaan pada slot sama hanya satu berhasil; bukti tepat waktu menahan slot tetapi belum diterima sebagai pembayaran; tanpa bukti setelah tenggat slot dilepas; akun lain tidak dapat akses detail/bukti.
### US2 Pegawai mengoperasikan lapangan (P1)
Walk-in, master harga/jam/status, blok pemeliharaan, verifikasi atau penolakan beralasan, tunai dan pembatalan.
Acceptance: penolakan awal melepas slot, persetujuan ulang/berlebih ditolak, perubahan master tidak mematahkan booking, semua mutasi penting diaudit.
### US3 Pemilik melihat penerimaan (P1)
Ringkasan harian/bulanan dan rincian dengan filter tanggal WIB.
Acceptance: total sama dengan rincian approved; pending/rejected tidak dihitung; pembatalan tanpa refund tetap dihitung.
### Edge Cases
Masa lalu, akhir hari, batas tenggat, pengajuan/persetujuan bersamaan, berlebih, file berbahaya, cancel vs approve, eskalasi peran, batas tengah malam WIB, lapangan nonaktif dan slot diblokir.

## Requirements
- FR-001: Katalog/harga/jam/ketersediaan dari penyimpanan aplikasi.
- FR-002: Registrasi pelanggan dan login/logout tiga peran dengan sesi aman.
- FR-003: Reservasi kelipatan satu jam, dalam jam buka, tidak lampau/bentrok termasuk permintaan bersamaan.
- FR-004: Status reservasi dan pembayaran terpisah, lifecycle sesuai DEMO-ASSUMPTIONS.md.
- FR-005: DP/pelunasan manual, bukti privat tervalidasi, keputusan beralasan, total tidak berlebih dan tidak dihitung ulang.
- FR-006: Master dan blok jadwal aman terhadap transaksi yang sudah ada.
- FR-007: Penerimaan harian/bulanan berdasarkan persetujuan WIB; agregat/rincian konsisten.
- FR-008: Audit pelaku/waktu, UI Indonesia desktop/HP dengan loading/kosong/error/sukses.
- FR-009: Lingkungan terpisah, akun fiktif, penanda demo, satu perintah jalan, dokumentasi dan bukti aktual.
### Key Entities
Akun/peran, lapangan, reservasi dengan harga tersimpan, blok, pengajuan pembayaran/bukti/keputusan, audit.

## Success Criteria
- SC-001: Alur pelanggan → DP → verifikasi → pelunasan → laporan berhasil di desktop/HP.
- SC-002: Tepat satu keberhasilan dari dua permintaan bersamaan yang bentrok.
- SC-003: Seluruh uji role, expiry, pembayaran, pembatalan dan rekonsiliasi lulus.
- SC-004: Total laporan sama persis rincian approved pada filter sama.
## Assumptions
Aturan sementara docs/DEMO-ASSUMPTIONS.md. Bukan produksi/UAT pengelola.
