# Keputusan arsitektur dan pengembangan

Keputusan ini berlaku untuk demo lokal, bukan persetujuan pengelola atas kebijakan usaha.

- **Pembagian tanggung jawab:** Laravel menguasai aturan/otorisasi/transaksi/database; Next.js App Router TypeScript menguasai UI/proxy. PostgreSQL dipertahankan.
- **Autentikasi:** Sanctum cookie/session first-party dengan CSRF; tidak memakai bearer token di localStorage.
- **Integritas jadwal:** transaksi dan urutan kunci court → booking → payment; exclusion constraint PostgreSQL menjaga overlap aktif bahkan di luar pemeriksaan UI.
- **Uang:** integer rupiah, snapshot harga/minimum DP pada transaksi. Perubahan master tidak mengubah tagihan lama.
- **Waktu dan laporan:** timestamp UTC; input/tampilan/report Asia/Jakarta. Penerimaan menjumlah pembayaran approved menurut reviewed_at, bukan total booking atau tanggal bermain.
- **Bukti:** penyimpanan privat, validasi MIME/extension/ukuran, download berotorisasi. Transfer/QRIS hanya simulasi tanpa rekening/QR aktif.
- **UI:** URL halaman/filter menjaga Back/refresh/direct URL dan niat booking. Checkout memeriksa ulang slot/harga serta meminta tindakan final. Agenda pegawai dan kartu penerimaan disusun untuk HP.
- **Kategori laporan:** DP/pelunasan/penuh ditentukan dari seluruh riwayat approved lalu dijumlah pada filter terpilih; kategori tidak mengubah definisi penerimaan.
- **Isolasi:** Compose lola-sport-demo, volume sendiri, PostgreSQL55433 lola_demo/lola_demo_test, API8001 dan web3001, rahasia lokal tiap komputer.
- **Tes:** E2E memakai layanan3002/8002 dan lola_demo_test dengan guard sebelum cleanup; cookie/storage/build terpisah. Backend check dan E2E bergantian.
- **Repo kelompok:** source, migration/seeder, tes/CI, lockfile, konfigurasi proyek dan panduan dibagikan. `.env` aktual, runtime/data/dependency terpasang serta perlengkapan AI tetap lokal. `.env.example` hanya template, sehingga anggota tidak mewarisi rahasia pembuat.

Seluruh aturan komersial sementara berada pada [DEMO-ASSUMPTIONS](DEMO-ASSUMPTIONS.md). Kegiatan pengujian tidak menggantikan validasi kebutuhan, persetujuan pengelola, atau UAT. Perubahan material perlu keputusan yang dicatat pada issue/PR dan dokumen terkait.
