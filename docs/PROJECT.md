# Kebutuhan demo Lola Sport

Demo pribadi diizinkan pengguna 18 Oktober 2026. Proposal asli dibaca sebagai baseline kebutuhan, tanpa menyalin PDF, ekstraksi, informasi pribadi atau lampiran ke Git. Bukan pelaksanaan UAT/wawancara atau sistem produksi.

Kebutuhan utama: katalog futsal/badminton dan ketersediaan database, reservasi pelanggan website dan walk-in pegawai, pencegahan overlap bersamaan, DP/pelunasan manual transfer/QRIS fiktif atau tunai, bukti privat dan verifikasi pegawai, laporan penerimaan pemilik, peran dan riwayat pribadi, antarmuka Indonesia desktop/HP.

Laravel owns domain/otorisasi/transaksi/persistence. Next App Router TypeScript owns UI/proxy. PostgreSQL dipertahankan. Sanctum session/cookie first party dengan CSRF, uang integer rupiah.

Aturan sementara di DEMO-ASSUMPTIONS.md menggantikan keputusan bisnis terbuka hanya untuk simulasi ini. Spec dan acceptance scenario di specs/001-demo/spec.md; plan/tasks/hasil pemeriksaan di folder sama.

Hasil akhir harus dapat dijalankan lokal dengan akun fiktif, sumber mandiri, database/runtime/rahasia terpisah, satu perintah jalan dan verifikasi aktual. Produksi, gateway, refund, pindah jadwal, deployment dan UAT pengelola tidak termasuk.

Redesign mobile terbaru mengikuti specs/002-mobile-redesign: alur pelanggan, agenda/verifikasi pegawai dan penerimaan pemilik, URL nyata dan pengujian responsive. Aturan simulasi tetap DEMO-ASSUMPTIONS; tidak ada klaim bisnis/tempat/ulasan/fasilitas baru.
