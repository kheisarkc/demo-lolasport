# Feature Specification: Redesign mobile Lola Sport
**Created**: 2026-10-18
**Status**: Disetujui pengguna untuk implementasi dan verifikasi lokal.

## User Scenarios & Testing
### US1 Pelanggan memesan dari HP (P1)
Pilih olahraga/tanggal/slot, lihat ringkasan dekat jari, login tanpa kehilangan pilihan, periksa checkout, pesan, kirim DP/pelunasan, pantau detail dan riwayat.
Acceptance: pilihan bertahan melalui login/refresh; tidak ada booking otomatis saat login; slot/harga diperiksa kembali; 409 memberikan jalan kembali; status reservasi dan pembayaran terpisah; countdown mengacu server; bukti privat dapat dipreview; cancel memerlukan konfirmasi dan tidak dikirim ganda.
### US2 Pegawai menjalankan pekerjaan harian (P1)
Dashboard hari ini, agenda per lapangan, walk-in/blok terfokus, antrean verifikasi terpisah, preview bukti dan keputusan, tunai/pelunasan, daftar master dengan editor tunggal.
Acceptance: semua angka nyata; slot terisi/blok/lewat jelas; konteks antrean bertahan; alasan tolak wajib; tunai menampilkan konfirmasi; harga lama tetap.
### US3 Pemilik memahami penerimaan (P1)
Periode cepat atau rentang tervalidasi; total approved, rincian DP/pelunasan/bayar penuh, kartu transaksi HP dan tabel desktop.
Acceptance: kategori menjumlah total; kategori tetap benar bila DP di luar filter; tanggal persetujuan WIB; tidak ada grafik satu angka yang dekoratif.
### Edge Cases
320px dan viewport pendek; form panjang/keyboard; kosong/no-result; jaringan gagal; 401/419/403; slot diambil; file invalid; double tap; direct URL/Back/refresh; role/ownership; filter tanggal invalid.

## Requirements
- FR-001 Katalog tanpa hero besar, filter olahraga, strip tanggal Hari ini/Besok, slot >=44px dengan jam/harga/status teks dan sticky bottom summary aman.
- FR-002 Login/daftar dan checkout terpisah; niat tersimpan, ketersediaan/harga terbaru ditampilkan sebelum final.
- FR-003 Detail URL langsung, dua status, langkah berikut, deadline server, preview upload privat, cancel dengan konsekuensi.
- FR-004 Reservasi saya mendatang/riwayat; pencarian/filter, loading/kosong/error/pemulihan.
- FR-005 Pegawai memiliki dashboard nyata dan agenda per lapangan HP, bukan katalog promosi; tambah walk-in/blok fokus.
- FR-006 Antrean verifikasi terpisah dengan pencarian/filter, angka tabular, preview perbesar dan approve/reject aman.
- FR-007 Master berupa daftar dan editor yang dibuka saat dibutuhkan; tunai dikonfirmasi.
- FR-008 Laporan cepat/custom dengan DP/pelunasan/bayar penuh yang rekonsiliasi dan kartu transaksi HP.
- FR-009 Navigasi URL, Back/refresh berfungsi, role tidak meluas, semua tombol bekerja.
- FR-010 Light mode kontras tinggi; label, fokus, input16px, target44px, safe-area, reduced motion; tanpa overflow dokumen320px.
- FR-011 Pertahankan aturan/stack/isolasi demo; mutasi pengujian otomatis hanya lola_demo_test, bukan database demo operasional.
- FR-012 Screenshot before/after enam area pada desktop/HP diperiksa; full checks dan E2E lulus dengan bukti aktual.

## Success Criteria
- Semua alur US1–US3 tuntas pada HP dan desktop.
- Tidak ada overflow dokumen pada320/360/390/393/430/1280px; tindakan utama44px dan input16px.
- Tidak ada console error aplikasi/hydration; invalid/empty/error dapat dipulihkan.
- Total laporan tepat sama rincian approved dan jumlah komponen pembayaran.
- Seluruh acceptance ditautkan tes/screenshot aktual; tidak mengklaim UAT.

## Key Entities & Assumptions
Entitas dan aturan komersial tetap specs/001-demo dan DEMO-ASSUMPTIONS. Kategori laporan hanyalah penyajian: pembayaran pertama kurang total=DP, pertama penuh=bayar penuh, berikutnya=pelunasan. Tidak mengubah penerimaan.

## Pola referensi
Adaptasi pola yang dijelaskan pengguna: AYO/Gelora (filter/strip tanggal/sticky summary), Cal.com Mobile (court switcher+agenda), Linear triage (antrean dan keputusan fokus), Stripe mobile (total+komponen+kartu transaksi). Tidak membuka repo eksternal, menyalin kode/aset atau menambah dependency. Tidak mengklaim implementasi proyek referensi telah diaudit.
