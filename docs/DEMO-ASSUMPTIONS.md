# Asumsi simulasi demo

Diizinkan pengguna 18 Oktober 2026 untuk eksperimen lokal saja. Bukan hasil wawancara, persetujuan pengelola, produksi, atau UAT.

- Seed satu futsal Rp150.000/jam, dua badminton Rp50.000/jam; buka 08.00–22.00 Asia/Jakarta. Harga/jam/status dapat diedit pegawai.
- Reservasi kelipatan satu jam, minimal satu jam, dalam satu tanggal, dalam jam buka, tidak lampau, maksimal 90 hari mendatang.
- Website memerlukan akun pelanggan. Walk-in atas nama fiktif dicatat pegawai tanpa akun wajib.
- DP minimal 50%, pembulatan ke atas integer; hold 30 menit. Konfigurasi DEMO_DP_PERCENT dan DEMO_HOLD_MINUTES. Snapshot minimum DP saat pesan.
- Status reservasi pending/review/confirmed menahan slot; cancelled/expired melepasnya. Status pembayaran unpaid/partial/paid terpisah, berdasarkan jumlah approved.
- Hold pending kedaluwarsa dilepas saat baca jadwal/riwayat atau mutasi. Tenggat efektif minimum hold dan waktu mulai. Bukti sebelum tenggat membuat review dan tetap menahan slot sampai keputusan.
- Satu pengajuan pending per reservasi. Pembayaran awal minimal DP; setelah DP pembayaran berikut harus tepat sisa. JPG/PNG/PDF maksimal 2 MB privat. Transfer/QRIS hanya instruksi simulasi, tanpa rekening/QR sungguhan.
- Tolak bukti awal membatalkan booking; tolak pelunasan tetap confirmed dan dapat diajukan kembali. Persetujuan DP mengonfirmasi. Tunai langsung diterima oleh pegawai dengan audit. Tidak boleh berlebih atau disetujui dua kali.
- Pembatalan pelanggan/pegawai hanya sebelum mulai. Approved tidak dikembalikan, pending ditolak otomatis. Tanpa refund/pindah jadwal.
- Harga transaksi disimpan. Perubahan jam/nonaktif ditolak bila mematahkan booking aktif mendatang. Tidak ada hapus permanen lapangan/transaksi.
- Pegawai bisa blok pemeliharaan dengan alasan, tanpa overlap, lalu membuka blok. Blok memakai entitas booking source block bernilai nol dan tidak masuk pembayaran.
- Pemilik hanya membaca laporan; pegawai mengelola semua reservasi; pelanggan hanya miliknya. Bukti hanya pelanggan pemilik reservasi dan pegawai.
- Laporan **Penerimaan pembayaran** memakai tanggal persetujuan Asia/Jakarta, termasuk booking batal tanpa refund. DP/pelunasan masing-masing sekali; pending/rejected tidak dihitung. Filter inklusif dan agregat memakai himpunan pembayaran sama. Dasar ini perlu validasi pengelola untuk proyek sebenarnya.
- Audit memuat pelaku/waktu untuk reservasi, bukti, keputusan, pembatalan, expiry, master dan blok. Tidak ada email eksternal, gateway, deployment atau data nyata.
