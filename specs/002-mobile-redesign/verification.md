# Verifikasi redesign mobile Lola Sport

Tanggal: 18 Oktober 2026. Baseline Git: `09e84d0`. Lingkungan lokal Windows, PHP 8.4.26, Laravel 13.37.0, Sanctum 4.3.3, Next.js 16.4.2, React 19.3, Node 22.16.0, PostgreSQL 17, dan Playwright 1.64.1. Pengujian dilakukan oleh agen; belum merupakan UAT pengelola.

## Hasil akhir

- `npm run check`: **lulus, exit 0**. Pint, 22 tes backend dengan 147 assertion, PHPStan tanpa error, ESLint, TypeScript frontend, TypeScript source E2E, dan build seluruh route berhasil.
- `npm run test:e2e`: **exit 0; 19 passed, 1 skipped; 5,2 menit**. Skip hanya pengulangan matriks viewport pada proyek Pixel 7. Matriks 320/360/390/393/430/1280 CSS px sudah dijalankan sekali secara lengkap. Alur setiap peran diuji pada desktop dan Pixel 7.
- Pemeriksaan read-only pada `http://127.0.0.1:3001` berhasil untuk katalog, dashboard pegawai, master dan laporan pemilik, tanpa pageerror. Total Rp1.300.000 saat pemeriksaan berasal dari data demo yang sudah ada.
- Implementasi dilakukan langsung di repo demo yang sama. Tidak ada dependency baru, migrasi domain, perubahan aturan komersial, push, deployment, atau perubahan fondasi induk.

## Temuan before

Dua belas screenshot enam area pada mobile 390 px dan desktop 1440 px disimpan di `.runtime/reports/redesign/before/` dan diperiksa. Pengukuran dalam `observations.json` menunjukkan:

- Hero pelanggan muncul di jadwal pegawai.
- Ringkasan booking HP mulai pada posisi y=1419 px, sementara tinggi viewport 844 px.
- Ukuran input utama 13 px dan empat formulir master terbuka sekaligus.
- Laporan HP setinggi 3966 px; tabel selebar 439 px berada di kontainer 312 px.
- Halaman detail tetap memakai URL `/`.

## Implementasi dan acceptance

- FR-001–004, pelanggan: katalog tanpa hero, filter olahraga, strip tanggal, slot dengan harga/status teks, serta ringkasan bawah. Pilihan URL bertahan melalui login dan refresh. Checkout memeriksa ulang harga/ketersediaan dan memerlukan konfirmasi. Detail memiliki URL sendiri, dua status, langkah berikutnya, countdown server, preview bukti privat, serta pembatalan dengan konsekuensi yang jelas. Daftar memisahkan jadwal mendatang dan riwayat.
- FR-005–007, pegawai: dashboard dengan angka nyata, agenda per lapangan di HP dan kolom lintas lapangan di desktop, formulir walk-in/blok yang fokus, antrean verifikasi terpisah, preview/perbesar bukti, perbandingan nominal, keputusan terkonfirmasi, pencatatan tunai, serta daftar master dengan satu editor saat dibutuhkan.
- FR-008, pemilik: periode cepat/custom, total approved dan komponen DP/pelunasan/bayar penuh, kartu transaksi HP, tabel desktop, dan pagination. Tren hanya ditampilkan jika lebih dari satu tanggal, dengan label dan satuan.
- FR-009–010: navigasi App Router, Back/refresh/direct URL, bottom navigation dan sidebar berlabel, safe area, input 16 px, target sentuh utama 44 px, fokus terlihat, label/aria-describedby, dialog native, reduced motion, dan state loading/error/404 berbahasa Indonesia.
- FR-011–012: database/runtime tes terisolasi, screenshot before/after diperiksa, dan dokumentasi serta checklist diperbarui.

## Pengujian browser

Pada desktop dan Pixel 7, skenario berikut lulus:

1. Pemilik membaca baseline penerimaan. Pelanggan memilih slot sebelum login, masuk dengan pilihan terjaga, me-refresh checkout, lalu mengonfirmasi booking futsal Rp150.000. Login sendiri tidak membuat booking.
2. Pelanggan mengunduh contoh PNG fiktif dari UI dan mengirim DP Rp75.000 dengan preview. Nilai diterima tetap Rp0 saat menunggu verifikasi.
3. Pegawai memeriksa preview/perbesar dan menyetujui DP. Kembali ke antrean mempertahankan filter.
4. Pelanggan mengirim pelunasan Rp75.000 melalui QRIS demo; pegawai menyetujui. Laporan pemilik bertambah tepat Rp150.000 dengan dua baris pembayaran terkait. Jumlah komponen sama dengan total.
5. Pegawai membuat walk-in, menerima tunai setelah konfirmasi, membatalkan tanpa menghilangkan penerimaan, membuat/membuka blok, menyimpan master, dan menambah lapangan nonaktif.
6. Registrasi, sesi setelah reload, logout, dan respons 401 setelah logout diuji. Login tanpa CSRF yang sesuai menghasilkan 419 melalui HTTP nyata.
7. Mutasi kedua mengambil slot saat checkout; UI menolak pilihan usang dan menyediakan langkah pemulihan. Dua ketukan tombol final mengirim tepat satu POST booking. Detail mendukung refresh, direct URL, dan Back.
8. File terlalu besar ditolak. Penolakan bukti awal dengan alasan membatalkan booking tanpa penerimaan. Pencarian tanpa hasil, rentang invalid, dan periode kosong menampilkan state yang sesuai.
9. Fault injection jaringan/401/419 menguji pemulihan UI; pembatasan role 403 juga diuji melalui API nyata. Login setelah pembacaan sesi gagal jaringan berhasil membersihkan error lama.

Matriks viewport membuka halaman pegawai, verifikasi bukti, master, dan laporan pemilik, termasuk viewport pendek 320×480 px serta formulir panjang. Tidak ditemukan overflow horizontal dokumen. Ukuran slot minimal 44 px, input minimal 16 px, fokus/Escape/pengembalian fokus dialog, dan lebar dialog diperiksa. Screenshot form pembayaran serta editor master 320 px disimpan.

Monitor pada alur normal tidak menemukan pageerror, hydration error, atau respons API 5xx kritis. Kegagalan jaringan/status yang sengaja diinjeksi adalah pengujian pemulihan, bukan klaim keberhasilan layanan.

## Backend dan isolasi

Dua tes kontrak baru diuji red/green: fields yang belum tersedia menyebabkan kegagalan awal, kemudian lulus setelah implementasi. Katalog menambah status slot dan `server_now` tanpa identitas pelanggan; detail menambah `server_now`; laporan menambah `kind` dan `totals_by_kind`. Kategori memakai seluruh riwayat approved sebelum agregasi filter, sehingga pelunasan tetap benar ketika DP berada di luar rentang. Seluruh tes lama, termasuk empat kasus konkurensi dua proses, tetap lulus.

E2E hanya memakai **lola_demo_test** pada PostgreSQL `127.0.0.1:55433`, melalui layanan 3002/8002. Sebelum `migrate:fresh --env=testing --seed`, guard memeriksa pgsql, host, port, nama database, dan `current_database()`. Backend `APP_ENV=e2e` memiliki guard tambahan dan tetap menguji CSRF HTTP nyata. Cookie `lola_demo_e2e_session`, storage `.runtime/e2e-storage`, dan build `.next-e2e` terpisah. Database operasional `lola_demo` tidak di-reset atau diisi oleh E2E redesign. Backend check dan E2E tidak boleh dijalankan bersamaan karena memakai database tes yang sama.

## Screenshot dan aksesibilitas

Semua enam area diperiksa pada mobile dan desktop:

- Before: `.runtime/reports/redesign/before/{mobile,desktop}-{catalog-booking,detail-payment,staff-schedule,staff-verification,staff-master,owner-report}.png`.
- After: `.runtime/reports/redesign/after/{chromium,mobile-chromium}-{catalog-booking,detail-payment,staff-schedule,staff-verification,staff-master,owner-report}.png`, beserta pasangan `-viewport.png`.
- Tambahan: `chromium-catalog-{320,390,1280}*.png`, `chromium-payment-form-320*.png`, dan `chromium-master-editor-320*.png` dalam folder after.
- Pemeriksaan instance 3001: `.runtime/reports/redesign/local-demo/`.

Capture panjang dipasangkan dengan viewport karena elemen fixed tetap berada di bawah viewport saat screenshot fullpage. Padding akhir memungkinkan seluruh konten/tindakan digulir melewati navigasi. Perbaikan hasil inspeksi meliputi tab lapangan yang menyusut, tindakan verifikasi yang menutupi kartu, urutan bukti/angka, capture yang terlalu cepat, dan penanda tanggal pilihan di luar pekan. Artefak diabaikan Git.

Rasio kontras token: teks utama 11,73:1; teks sekunder 6,04:1; tombol 7,23:1; badge 6,35–6,81:1. Batas kontrol diperkuat. Ini pemeriksaan teknis terhadap prinsip WCAG 2.2 AA yang diterapkan, bukan sertifikasi aksesibilitas menyeluruh.

## Temuan yang diselesaikan dan batas

Runner development awal mengalami reload dan ECONNREFUSED; build/start terpisah membuat pengujian stabil. Request pembanding diberi Origin sesuai Sanctum. Locator alert dibatasi ke main agar tidak menangkap route announcer Next. Tes Back menunggu navigasi, fixture matriks memakai penerimaan nyata, dan source E2E mendapat typecheck. Pemulihan error auth diperbaiki. Windows sempat mengunci berkas trace saat teardown (EBUSY); trace lokal dimatikan sementara screenshot/assertion tetap dijalankan. CI tetap menyimpan trace kegagalan. Putaran final lulus tanpa mengurangi persyaratan perilaku.

Belum diuji: HP fisik, keyboard virtual/iOS/Safari, Firefox/WebKit, GitHub Actions, beban produksi, serta audit aksesibilitas/keamanan independen. Belum ada UAT pengelola atau pembayaran nyata. Pagination client ditujukan untuk skala demo. Pola referensi diadaptasi dari deskripsi pengguna tanpa membuka repo eksternal atau menyalin kode/aset.
