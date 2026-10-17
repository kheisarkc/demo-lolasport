# Status demo

18 Oktober 2026: cakupan demo lokal selesai diimplementasikan dan diverifikasi. Bukan produksi atau UAT pengelola.

## Hasil
- Repo demo mandiri, remote `https://github.com/kheisarkc/demo-lolasport.git`, branch `codex/001-demo`. Riwayat awal `d8b230c` dipertahankan.
- Fondasi dari snapshot Git `c628fdc533e0832c7b98d3a0739056073175cc9d`. Repo induk tetap bersih; hanya pengecualian lokal `/demo-pengerjaan-sendiri/` pada `.git/info/exclude`.
- Dependency/runtime mandiri. PostgreSQL demo/test pada 127.0.0.1:55433, Compose `lola-sport-demo`, volume `lola-sport-demo_lola_demo_postgres`. Rahasia lokal baru, tidak masuk Git.
- Laravel/Sanctum dan Next terhubung untuk pelanggan, pegawai dan pemilik: katalog, reservasi, expiry, pembayaran manual/bukti privat, verifikasi, walk-in/tunai, blok/master, pembatalan, audit dan laporan penerimaan WIB.
- Spec/plan/tasks dan kontrak/data model ada di `specs/001-demo/`; asumsi di `docs/DEMO-ASSUMPTIONS.md`.
- Jalankan `npm run dev`; buka http://127.0.0.1:3001. Akun/langkah mencoba ada di README. Server demo dibiarkan aktif saat penyerahan.

## Bukti aktual
- Bootstrap dependency/migrasi/seed berhasil pada database demo terverifikasi, tanpa reset operasional.
- `npm run check`: lulus; 20 tes backend, 127 assertion, termasuk empat kasus dua proses PHP independen. Pint, PHPStan (0 error), ESLint, typecheck dan build lulus.
- `npm run test:e2e`: 10/10 lulus, Chromium desktop dan emulasi Pixel 7; putaran terakhir 2,2 menit. Unduh PNG demo → DP → verifikasi → pelunasan → kenaikan penerimaan tepat Rp150.000 dan dua baris per booking.
- `npm run doctor` lulus: PHP 8.4.26, Node 22.16.0, pdo_pgsql, container sehat pada loopback demo. Composer validate lulus.
- Screenshot katalog desktop/mobile, detail DP/verifikasi, master dan laporan diperiksa. Artefak lokal di `.runtime/reports/` dan `test-results/`, diabaikan Git.
- Kandidat Git diperiksa terhadap rahasia lokal/artefak terlarang; tidak ditemukan `.env`, dependency, upload privat, PDF proposal, database atau hasil tes yang akan dilacak. Konfigurasi aktif tidak lagi merujuk port/database fondasi.

## Temuan yang diperbaiki
- Assertion E2E menerima spasi format rupiah Indonesia, tetap memeriksa nol. Waktu tunggu respons dev dinaikkan tanpa mengurangi syarat perilaku. Pengujian ulang lulus.
- Launcher E2E memakai Chromium runtime demo. Script screenshot mengatur lokasi browser sebelum mengimpor Playwright.
- Default `.env.example`, database/sesi dan perintah langsung Laravel/Next disamakan dengan isolasi demo.

## Batas dan langkah aman berikutnya
- Tidak ada kebutuhan implementasi dalam cakupan ini yang masih terbuka. Laporan: `specs/001-demo/verification.md`.
- Belum diuji pada HP fisik, Firefox/WebKit, mesin Windows baru atau GitHub Actions. Tidak ada uji beban produksi, pembayaran nyata, wawancara, persetujuan pengelola atau UAT.
- E2E menambahkan data fiktif tanpa menghapusnya. Angka laporan awal berubah setelah tes; bukan penerimaan usaha sungguhan.
- MCP demo belum dimuat ulang dalam sesi ini; instruksi versi terpasang dan CLI dipakai. Tidak mengubah pengaturan global/sandbox. Tidak push/deploy.
- Langkah berikutnya: buka aplikasi dan coba akun pada README. Jika server berhenti, jalankan `npm run dev` dari root demo. Tidak perlu reset/setup ulang. Jangan menjalankan `migrate:fresh` atau menghapus volume demo.
