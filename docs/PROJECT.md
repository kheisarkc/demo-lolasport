# Kebutuhan dan batas demo Lola Sport

Demo reservasi futsal/badminton dengan tiga peran: pelanggan, pegawai dan pemilik. Tujuannya menyatukan jadwal, reservasi, pembayaran manual dan penerimaan agar dapat ditelusuri. Ini eksperimen pribadi berbantuan AI sebagai bahan belajar, belum hasil final kelompok atau UAT pengelola.

## Kebutuhan utama

- Katalog lapangan, harga dan jadwal tersedia dari database; reservasi kelipatan satu jam tanpa bentrok, termasuk saat permintaan bersamaan.
- Registrasi/login/logout pelanggan; pelanggan hanya membaca dan mengubah reservasinya sendiri sesuai aturan.
- Reservasi website, riwayat/detail, tenggat, pengajuan bukti DP/pelunasan dan pembatalan sebelum mulai.
- Pegawai menangani walk-in, jadwal/blok pemeliharaan, master lapangan, bukti transfer/QRIS demo dan pencatatan tunai.
- Bukti privat tervalidasi; persetujuan tidak ganda dan total diterima tidak melebihi tagihan; penolakan beralasan.
- Pemilik membaca ringkasan/rincian penerimaan approved menurut tanggal persetujuan WIB, dengan kategori DP/pelunasan/bayar penuh yang cocok dengan total.
- Jejak perubahan penting memuat pelaku dan waktu; UI Indonesia responsif, navigasi URL, loading/kosong/error/sukses dan pemulihan.

## Kriteria penerimaan yang perlu dijaga

1. Dua permintaan bentrok hanya menghasilkan satu booking aktif; waktu bersebelahan diperbolehkan.
2. Pelanggan lain tidak dapat mengakses detail/bukti; hak pegawai/pemilik dibatasi backend.
3. Bukti pending belum menambah penerimaan. DP approved mengonfirmasi booking; pelunasan membuat pembayaran lunas.
4. Expiry/pembatalan/penolakan awal melepas slot sesuai asumsi; approved tetap tercatat pada simulasi tanpa refund.
5. Total laporan sama dengan rincian approved dan jumlah komponennya pada rentang persetujuan WIB yang sama.
6. Alur utama tiga peran dapat diselesaikan pada HP/desktop; Back, refresh dan direct URL berfungsi.
7. Setup menggunakan konfigurasi/data fiktif lokal, tanpa akun atau dependency AI; tes terpisah dari database operasional demo.

## Batas dan sumber keputusan

Laravel memiliki aturan, otorisasi, transaksi dan persistence; Next.js menangani antarmuka/proxy; PostgreSQL menyimpan data. [Asumsi demo](DEMO-ASSUMPTIONS.md) menetapkan aturan sementara, bukan persetujuan pengelola. [Keputusan teknis](DECISIONS.md), [arsitektur/API](ARSITEKTUR-DAN-ALUR.md), dan [pengujian](PENGUJIAN.md) menjadi rujukan perubahan.

Tidak termasuk gateway, pembayaran nyata, refund, pindah jadwal, deployment atau klaim UAT. Definisi omzet/kebijakan nyata, kegunaan dengan manusia, data operasional dan penerapan harus dibahas kembali bersama kelompok/pengelola. Source tidak menyertakan proposal/transkrip atau informasi pribadi.
