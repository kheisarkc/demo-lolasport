# Aturan demo

Sejak 10 November 2026 aturan demo ini disamakan dengan **lola-sport-v1**, aplikasi yang nanti dipakai untuk UAT. Tampilan web ini tetap versi lama dan dipakai sebagai prototipe bimbingan. Harga dan jam buka berasal dari wawancara pemilik (9 Okt 2026), DP 50% dari pemilik (8 Nov 2026). Aturan lain adalah keputusan tim dan belum menjadi hasil UAT.

| Topik | Aturan |
| --- | --- |
| Akun | Pelanggan tidak punya akun. Cukup nama dan nomor WhatsApp. Pesanan dibuka lagi lewat **Cek pesanan** dengan kode booking (LS-XXXXXX) + nomor WhatsApp. Akun hanya untuk penjaga dan pemilik. |
| Lapangan dan harga | Futsal Sintetis Rp130.000/jam, Futsal Vinil Rp160.000/jam, Badminton 1 dan 2 Rp35.000/jam. Pemilik dapat mengubah harga; harga pesanan lama tetap. |
| Jam buka | 07.00–01.00 (18 slot). Slot 00.00 termasuk tanggal yang dipilih (tanggal operasional), bukan tanggal kalender berikutnya. |
| Jarak pesan | Paling jauh 30 hari ke depan. Kelipatan satu jam, tidak boleh jam yang sudah lewat. |
| DP | Minimal 50% dari total, dibulatkan ke atas. Diatur pemilik. |
| Batas bayar | 30 menit setelah pesan (paling lama sampai jam mulai). Lewat batas tanpa bukti, pesanan kedaluwarsa dan jam dilepas. Diatur pemilik. |
| Pembayaran pelanggan | QRIS dengan unggah bukti (JPG/PNG/PDF ≤ 2 MB). Pembayaran pertama minimal DP, pembayaran berikutnya harus tepat sisa. |
| Pemeriksaan bukti | Penjaga menerima atau menolak dengan alasan. **Bukti DP pertama ditolak = pesanan batal** dan jam dibuka lagi. Bukti pelunasan ditolak = pesanan tetap terkonfirmasi. |
| Bayar di tempat | Penjaga mencatat tunai atau QRIS di tempat; langsung tercatat diterima tanpa bukti unggah. |
| Walk-in | Dicatat penjaga dengan nama (WhatsApp boleh kosong), wajib bayar minimal DP saat itu, langsung terkonfirmasi tanpa batas waktu. |
| Hadir / tidak datang | Hadir hanya bila lunas, paling cepat 60 menit sebelum main; jam selesai tetap. Tidak datang ditandai setelah jam mulai; DP hangus. |
| Batal | Pelanggan bisa membatalkan sendiri selama belum membayar. Setelah membayar, pembatalan lewat penjaga sebelum jam mulai; uang tidak dikembalikan. Tidak ada pindah jadwal. |
| Tutup lapangan | Penjaga menutup jam tertentu dengan alasan, lalu bisa membukanya lagi. |
| Pemilik | Melihat laporan penerimaan (DP/pelunasan/bayar penuh, tunai/QRIS, DP hangus) dan mengatur harga, DP, batas bayar, serta lapangan aktif. Pemilik tidak mengubah pesanan. |
| Laporan | Uang dihitung pada tanggal diterima/disetujui (WIB), termasuk pesanan yang batal atau tidak datang. |

Tidak ada gateway pembayaran, notifikasi WhatsApp otomatis, atau data pelanggan nyata. Gunakan data fiktif.
