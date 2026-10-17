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

- D-010: Redesign18Oktober2026 dilakukan langsung di repo demo. URL App Router menggantikan view state tunggal; filter/niat booking nonrahasia tersimpan pada query. Checkout memeriksa ulang slot/harga dan memerlukan tindakan final.
- D-011: UI mobile terang memakai identitas hijau lapangan, tab tanggal/slot tekstual, bottom nav, sticky selection, agenda pegawai, antrean bukti dan kartu penerimaan. Referensi diadaptasi dari pola yang diberikan pengguna, tanpa menyalin kode/aset eksternal.
- D-012: API additive menyediakan status slot, jam server, dan kategori penerimaan. DP/pelunasan/bayar penuh ditentukan dari seluruh riwayat approved lalu diakumulasi pada filter; aturan penerimaan/otorisasi tetap.
- D-013: E2E redesign hanya lola_demo_test melalui layanan3002/8002 terpisah. Pembersihan tes dijaga sebelum migrasi. Next test memakai build/start dan storage/cookie sendiri; demo3001/8001 tetap tersedia.
