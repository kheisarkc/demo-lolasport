# Panduan kelompok: dari clone sampai bisa mencoba

[← README](../README.md) · [Pahami kode](ARSITEKTUR-DAN-ALUR.md) · [Mulai mengubah](../CONTRIBUTING.md)

Panduan ini untuk anggota yang belum pernah menjalankan proyek. Lu tidak perlu akun Codex, ChatGPT, atau API key AI. Ini demo pribadi berbantuan AI sebagai bahan belajar; aturan usaha masih simulasi, bukan persetujuan pengelola atau UAT.

## 1. Siapkan komputer

Jalur bootstrap yang tersedia menargetkan **Windows + PowerShell 7**. Pastikan program berikut sudah terpasang. Buka PowerShell 7, lalu periksa satu per satu:

```powershell
git --version
pwsh --version
node --version
npm --version
php -v
composer --version
docker version
```

- Node minimal 22.16; source terakhir diverifikasi memakai Node 22.16.
- PHP **8.4** dengan extension `pdo_pgsql`/`pgsql` dan kebutuhan Composer. PHP 8.2 dari XAMPP tidak cukup. Bootstrap memilih `C:\Tools\php84\php.exe` jika ada, selain itu `php` pada PATH. Jika versi salah, siapkan PHP 8.4 dahulu; tidak perlu mengganti PHP XAMPP.
- Composer standar Windows: bootstrap mencari `composer.phar` di folder yang sama dengan launcher Composer.
- Docker Desktop harus sudah berjalan dengan Linux containers. `docker version` harus menampilkan bagian Client dan Server. Adanya Client saja belum cukup.
- Gunakan `pwsh`, bukan Windows PowerShell 5.1. Bootstrap memakai fitur PowerShell 7.

Jika ada program yang belum ditemukan, selesaikan instalasi dari sumber resminya dahulu, lalu buka terminal baru. Bootstrap memasang dependency **aplikasi dan pengujian**, bukan otomatis memasang seluruh program komputer. Python dan tool AI tidak diperlukan. Internet diperlukan untuk clone, paket, image PostgreSQL, dan browser pengujian. Jangan menonaktifkan proteksi/global execution policy untuk melewati pesan error; catat error spesifiknya.

## 2. Ambil source dan jalankan

Pilih folder kerja sendiri yang mudah ditemukan. Jangan clone ke folder proyek yang sudah berisi pekerjaan.

```powershell
git clone https://github.com/kheisarkc/demo-lolasport.git
cd demo-lolasport
pwsh -File scripts/bootstrap.ps1
npm run dev
```

Jika repo privat, akun GitHub lu perlu diundang oleh pemilik repo. Jangan menaruh token akses di file source atau URL yang dibagikan.

**Apa yang dilakukan bootstrap:** memasang paket dari `composer.lock`/`package-lock.json`, menyiapkan runtime PHP proyek dan Chromium untuk tes browser, membuat rahasia/konfigurasi lokal bila belum ada, menyalakan PostgreSQL, menjalankan migrasi tambahan dan seed. Migrasi membuat/menyesuaikan struktur tabel; seed mengisi tiga akun dan tiga lapangan fiktif. Ini bukan perintah reset transaksi.

**Apa yang dilakukan `npm run dev`:** menyalakan database bila perlu, menjalankan migrasi tambahan/seed idempoten, lalu Laravel dan Next.js. Idempoten berarti seed tidak menduplikasi data contoh yang sudah ada. Akun/harga contoh yang sudah diubah tidak otomatis di-reset ke awal.

Buka **http://127.0.0.1:3001**. Gunakan alamat itu secara konsisten, jangan berganti ke `localhost` karena cookie/origin disetel untuk `127.0.0.1`.

Pada pemakaian berikutnya:

```powershell
cd demo-lolasport
npm run dev
```

Sesudah mengambil pembaruan repo, baca perubahan README dan lockfile. Bila dependency berubah, jalankan ulang `pwsh -File scripts/bootstrap.ps1` setelah menyimpan pekerjaan lokal. Jangan menyalin dependency teman dan jangan menghapus database agar setup bisa diteruskan.

Jalankan hanya satu launcher per salinan. `Ctrl+C` pada terminal launcher menghentikan server yang diluncurkannya. Untuk menghentikan container database tanpa menghapus data:

```powershell
npm run db:stop
```

GitHub bukan hosting demo. Alamat `127.0.0.1` menunjuk komputer lu sendiri, bukan komputer pembuat atau teman. Panduan ini tidak mengekspos aplikasi ke jaringan/HP fisik. Tampilan HP dapat dicoba melalui mode perangkat browser; pengujian HP fisik belum diklaim selesai.

## 3. Coba alur utama

Kata sandi: **`DemoLola2026!`**.

- Pelanggan `pelanggan@lola.test`.
- Pegawai `pegawai@lola.test`.
- Pemilik `pemilik@lola.test`.

Data awal: Futsal Arena Rp150.000/jam, Badminton 1 dan 2 masing-masing Rp50.000/jam, buka 08.00–22.00 WIB. Ini bukan klaim inventaris atau harga usaha nyata.

1. Masuk sebagai pemilik di `/masuk`, buka `/pemilik/laporan`, pilih **Hari ini**, lalu catat total awal. Keluar melalui `/akun`.
2. Di `/`, pilih tanggal mendatang, lapangan futsal dan satu jam tersedia. Klik **Lanjutkan**, masuk sebagai pelanggan. Pilihan tetap ada, tetapi reservasi belum dibuat.
3. Pada checkout, periksa tanggal, waktu, harga, minimal DP dan aturan. Centang konfirmasi, lalu buat reservasi. Detail memakai `/reservasi/{id}`; catat ID.
4. Pada formulir pembayaran, unduh contoh PNG fiktif, pilih transfer demo, isi Rp75.000 dan unggah PNG tersebut. Nilai diterima masih Rp0; status menunggu verifikasi. Tidak ada transfer uang sungguhan.
5. Keluar, masuk sebagai pegawai, buka **Verifikasi**. Cari ID, buka/perbesar bukti, lalu setujui. DP diterima membuat booking terkonfirmasi dengan sisa Rp75.000.
6. Masuk kembali sebagai pelanggan, buka **Reservasi saya**, lalu detail yang sama. Kirim pelunasan Rp75.000. Pegawai memeriksa dan menyetujuinya seperti langkah sebelumnya.
7. Pemilik membuka periode yang mencakup kedua persetujuan. Kenaikan terhadap total awal seharusnya Rp150.000, terdiri dari dua pembayaran terkait booking. Jika ada transaksi contoh lain, cocokkan ID dan rincian, bukan hanya total keseluruhan.

Reservasi awal menahan slot maksimal 30 menit (atau sampai waktu mulai). Bukti tepat waktu mempertahankan slot selama review. Harga/DP/tenggat mengikuti konfigurasi dan master aktual; contoh di atas memakai seed awal. Gunakan [asumsi lengkap](DEMO-ASSUMPTIONS.md) untuk memahami pembatalan, penolakan, dan batas nominal.

## 4. Coba fitur lain

- **Pegawai → Jadwal:** pilih lapangan/tanggal/jam kosong, buat walk-in atas nama fiktif, lalu catat tunai pada detail. Konfirmasi tunai langsung menambah penerimaan.
- **Pegawai → Jadwal:** buat blok pemeliharaan dengan alasan. Slot menjadi diblokir, tanpa tagihan. Buka blok dari detail sebelum waktunya mulai.
- **Pegawai → Kelola lapangan:** buka satu editor, ubah nama/harga contoh. Harga booking lama tetap. Perubahan jam/nonaktif ditolak bila merusak reservasi aktif.
- **Pelanggan → Reservasi saya:** lihat mendatang/riwayat, refresh/direct URL, dan pembatalan sebelum mulai. Pembayaran diterima tidak dikembalikan dalam simulasi.
- **Pegawai → Verifikasi:** tolak bukti fiktif dengan alasan. Penolakan awal membatalkan booking; penolakan pelunasan mempertahankan booking yang sudah terkonfirmasi.
- **Pemilik → Penerimaan:** ganti hari ini/bulan ini/rentang khusus. Angka menjumlah approved pada tanggal persetujuan WIB, bukan tanggal bermain atau total seluruh booking.

## 5. Periksa hasil perubahan

```powershell
npm run doctor
npm run check
npm run test:e2e
```

Jalankan bergantian, bukan dalam dua terminal sekaligus. `doctor` memeriksa runtime; `check` menjalankan format PHP, tes backend, analisis PHP, lint, pemeriksaan tipe, dan build; E2E menjalankan alur browser desktop serta emulasi HP.

**Tes boleh membersihkan hanya `lola_demo_test`.** Guard memeriksa tujuan aktual sebelum cleanup. Runner browser memakai port 3002/8002, cookie/storage/build tersendiri. Jangan melemahkan guard agar tes lolos. Jangan menjalankan `migrate:fresh`, menghapus volume, atau `docker compose down -v` pada database demo.

Laporan hasil browser lokal berada di `playwright-report/` dan `test-results/`; screenshot redesign historis tidak ikut clone karena berada di `.runtime/`. Baca [panduan dan hasil pengujian](PENGUJIAN.md). Hasil komputer pembuat tidak membuktikan komputer anggota sudah lulus.

## 6. Kalau belum berjalan

- **`pwsh` tidak ditemukan:** terminal/program yang dibutuhkan adalah PowerShell 7.
- **PHP terlalu lama:** periksa `php -v` dan lokasi PHP. Bootstrap mendahulukan `C:\Tools\php84\php.exe`; jangan memakai PHP XAMPP 8.2 untuk proyek ini.
- **`composer.phar was not found`:** periksa instalasi Composer Windows standar. Jangan menyalin `vendor` atau runtime absolut dari komputer teman.
- **Docker socket/engine tidak ditemukan:** buka Docker Desktop dan tunggu engine siap. Periksa `docker version` lagi. Jangan menghapus volume untuk memperbaiki engine yang belum berjalan.
- **Port sudah dipakai:** periksa apakah launcher yang sama masih aktif. Jangan mematikan proses yang tidak dikenal. Port tes dapat diubah dengan variabel yang dijelaskan di [SETUP](SETUP.md); port operasional harus diperbarui konsisten pada semua konfigurasi/guard.
- **`could not find driver`:** extension PostgreSQL PHP belum terbaca. Gunakan launcher proyek sesudah bootstrap; `.runtime/php.ini` berbeda dari konfigurasi XAMPP.
- **401/419 atau gagal login:** gunakan `127.0.0.1:3001`, muat ulang lalu masuk kembali; periksa server API dan pesan terminal. Jangan menonaktifkan CSRF.
- **Slot yang dipilih sudah hilang:** pengguna lain atau percobaan sebelumnya mungkin sudah menahannya. Muat ulang dan pilih waktu lain; jangan menghapus data supaya slot kosong.
- **Clone/unduhan gagal:** periksa internet, akses repo, ruang disk dan error asli. Rahasia pada `.env` jangan disertakan saat membagikan log.
- **macOS/Linux:** source dan CI menyediakan referensi, tetapi bootstrap Windows bukan petunjuk lintas OS yang sudah diuji. Catat kebutuhan adaptasi; jangan mengklaim langkah Windows bekerja persis sama.

Jika meminta bantuan, sertakan OS, versi Node/PHP, perintah, error asli yang sudah disunting dari rahasia, dan apakah gagal sebelum atau sesudah halaman terbuka. Tidak perlu mengirim `.env` atau database.

## 7. Bedakan source dan konfigurasi pribadi

Yang diambil saat clone: frontend/backend, migration/seeder, tes, lockfile, Compose, skrip setup dan panduan. Migration menjelaskan struktur database; seeder membuat akun/lapangan contoh. Data transaksi komputer pembuat tidak ikut dibagikan.

`.env.example` hanya contoh nama variabel dan nilai demo/placeholder. File `.env` aktual berisi password serta kunci lokal dan dibuat sendiri oleh bootstrap. Jangan mengganti template dengan salinan `.env` teman, dan jangan commit `.env`.

Instruksi agent, skill, konfigurasi editor AI, serta arsip proses pribadi tidak diperlukan dan diabaikan Git. Mengembangkan aplikasi dapat dilakukan dengan editor biasa tanpa AI.
