# Keputusan demo

- D-001: Pengguna mengizinkan implementasi lengkap dan pengujian lokal demo dalam sesi ini, 18 Oktober 2026. Stage Spec Kit tidak memerlukan konfirmasi ulang.
- D-002: Stack Laravel/Next/PostgreSQL dan pemisahan domain/API/UI dikunci.
- D-003: Demo mempunyai Git sendiri dengan remote demo-lolasport. Tidak push. Snapshot source fondasi, tanpa runtime/.env/dependency/data. Induk hanya read-only selain exclude lokal folder demo.
- D-004: Compose lola-sport-demo, volume terpisah, port 55433/8001/3001, database lola_demo dan lola_demo_test, session khusus demo, rahasia baru.
- D-005: Seluruh aturan simulasi pengguna dan pilihan kecil konsisten tercatat pada DEMO-ASSUMPTIONS.md. Tidak menggantikan kebutuhan persetujuan pengelola untuk proyek sebenarnya.
- D-006: Transaksi mengunci court → booking → payment; PostgreSQL exclusion constraint menjaga overlap. Persetujuan/payment totals dan expiry mengikuti kunci yang sama.
- D-007: Timestamp UTC, input/report Asia/Jakarta. Penerimaan berdasarkan reviewed_at pembayaran approved, bukan total booking atau tanggal pemakaian.
- D-008: Bukti privat, MIME/extension/size validation dan download berotorisasi. Tidak ada QR/rekening aktif.
- D-009: Spec Kit workflow tunggal. MCP yang tersedia boleh dibaca; tools yang tidak termuat memakai vendor/dokumentasi resmi lokal tanpa mengubah global settings.

Keputusan pengelola untuk produksi, kebijakan komersial nyata dan UAT tetap belum diperoleh. Hasil pengujian internal dicatat terpisah.
