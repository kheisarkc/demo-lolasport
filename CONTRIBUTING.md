# Mengutak-atik Lola Sport bersama kelompok

[Mulai mencoba](docs/PANDUAN-KELOMPOK.md) · [Peta kode](docs/ARSITEKTUR-DAN-ALUR.md) · [Workflow proyek](docs/WORKFLOW.md)

Ini usulan cara kerja, bukan pembagian kontribusi yang sudah terjadi. Demo berbantuan AI dapat dipakai seluruhnya, sebagian, atau hanya sebagai bahan perbandingan setelah kelompok menyepakatinya. Jangan menyebutnya hasil final kelompok/UAT sebelum ada kegiatan dan buktinya.

## 1. Sebelum mengubah

1. Jalankan dan coba alur satu reservasi sampai laporan.
2. Baca [AGENTS.md](AGENTS.md), [PROJECT](docs/PROJECT.md), [DECISIONS](docs/DECISIONS.md), [STATE](docs/STATE.md), dan [asumsi demo](docs/DEMO-ASSUMPTIONS.md).
3. Tentukan perubahan kecil dan hasil yang diharapkan. Jika menyentuh aturan usaha, sepakati dahulu sumber keputusannya.
4. Baca file terkait. Backend mempunyai [instruksi sendiri](apps/api/AGENTS.md); frontend mengikuti [instruksi versi Next](apps/web/AGENTS.md). Dokumentasi Next terpasang tersedia setelah pemasangan dependency.
5. Catat kebutuhan, rencana dan tugas di `specs/<nomor>-<fitur>/` mengikuti Spec Kit. Dokumentasi boleh ringkas sesuai ukuran perubahan; jangan membuat centang kelulusan tanpa pemeriksaan.

Jangan membagikan `.env`, kata sandi lokal, database, upload, dependency atau PDF/transkrip proposal yang mengandung informasi pribadi. Akun demo yang terdokumentasi memang fiktif; rahasia runtime adalah hal berbeda.

## 2. Contoh latihan pertama

**Latihan aman:** perjelas pesan kosong pada Reservasi Saya, tanpa mengubah aturan booking.

- Temukan komponen `BookingsPage` di [bookings.tsx](apps/web/src/components/bookings.tsx).
- Cari keadaan daftar kosong dan pahami kapan ia muncul.
- Ubah kalimat supaya menjelaskan langkah berikutnya; pakai istilah Indonesia konsisten.
- Coba daftar kosong dan berisi, desktop dan lebar 320 px. Pastikan tautan pemulihan benar-benar bekerja.
- Periksa lint/typecheck dan diff. Sertakan screenshot lokal jika perubahan tampilan perlu review.

Latihan berikutnya: rapikan label/hint form atau susunan kartu laporan. Mengubah DP 50%, masa hold, refund, otorisasi, atau perhitungan laporan bukan perubahan tampilan kecil: perlu keputusan, spesifikasi, dan tes perilaku.

## 3. Siklus Git yang sederhana

Jalankan dari root. Contoh ini mengasumsikan clone bersih dan lu sudah punya akses repo.

```powershell
git status
git switch main
git pull --ff-only origin main
git switch -c kelompok/pesan-reservasi-kosong
```

Jika `git status` menunjukkan perubahan sebelumnya, simpan/tinjau dahulu; jangan reset supaya perintah bisa diteruskan. `pull --ff-only` berhenti bila riwayat perlu digabung, bukan menimpa pekerjaan.

Setelah mengubah dan memeriksa:

```powershell
git diff
git add apps/web/src/components/bookings.tsx
git diff --cached
git commit -m "Perjelas pesan reservasi kosong"
git push -u origin kelompok/pesan-reservasi-kosong
```

Periksa nama file sebelum `git add`; jangan asal memasukkan semua file. Buat Pull Request di GitHub dari branch tersebut ke `main`, tulis masalah, hasil perubahan, pemeriksaan aktual, dan batasnya. Minta satu anggota meninjau sebelum digabung. Tidak perlu force push. Jika tidak punya akses tulis, minta undangan collaborator; alternatif fork dipilih bila akses/visibilitas repo mengizinkan.

Sebelum memulai perubahan berikutnya, kembali ke `main` yang bersih dan ambil hasil terbaru. Saat konflik, baca kedua perubahan dan sepakati hasil; jangan memilih “accept all” tanpa memahami dampaknya. Jangan mengubah fungsi transaksi bersama pada dua branch besar tanpa koordinasi.

## 4. Pilih pemeriksaan yang sesuai

```powershell
npm run doctor
npm run check
npm run test:e2e
```

- `check`: format PHP tanpa mengubahnya, tes PostgreSQL, analisis PHP, lint, TypeScript frontend/tes dan build.
- E2E: alur nyata browser pada layanan tes, termasuk pelanggan, pegawai, pemilik dan edge cases.
- Jalankan check dan E2E bergantian. Keduanya memakai **lola_demo_test**. Runner boleh membersihkan hanya database tes yang telah dijaga. Jangan melemahkan guard atau mengganti tujuannya ke `lola_demo`.
- Pemeriksaan kecil selama menulis dapat memakai `npm run lint --workspace apps/web` atau `npm run typecheck --workspace apps/web`; pemeriksaan itu bukan pengganti alur browser untuk perubahan interaksi.

Jika gagal, baca error asli dan tindakan pemicunya, lihat perubahan terakhir, bentuk satu dugaan, lalu uji perbaikan terarah. Jangan mengubah ekspektasi tes hanya agar cocok dengan bug. Tes harus memeriksa kebutuhan dan perhitungan yang disepakati.

Pada PR, bedakan “pernah lulus menurut laporan 002” dengan “dijalankan pada perubahan ini”. Hasil tes, pemeriksaan visual, tes kegunaan manusia, dan UAT bukan hal yang sama.

## 5. Review sebelum digabung

- Perubahan sesuai tujuan; file tidak terkait dipertahankan.
- Aturan/akses tetap di Laravel; proxy Next tidak mengambil alih transaksi.
- Harga dan uang tetap integer; WIB, status booking/pembayaran dan total approved tetap konsisten.
- Tidak ada rahasia, data nyata, dependency/runtime atau laporan sensitif masuk Git.
- Label, error, loading/kosong, target sentuh dan lebar HP diperiksa jika UI berubah.
- Tes relevan berjalan pada tujuan aman; hasil aktual dan keterbatasan ditulis.
- Kebutuhan/keputusan/spec/STATE diperbarui bila perilaku berubah.
- Tidak ada klaim wawancara, kontribusi anggota, persetujuan, atau UAT yang belum terjadi.

## 6. Usulan pembagian tiga anggota

**A — pelanggan:** pahami kebutuhan pelanggan, periksa alur HP, kerjakan komponen pelanggan, tes browser, dan panduan pengguna. Hasil review: alur, kode, bukti tes, temuan kegunaan.

**B — pegawai dan transaksi:** pahami operasional, verifikasi/walk-in/blok, aturan akses dan konkurensi. Hasil review: aturan terkonfirmasi, kontrak/kode, tes domain, panduan pegawai. Kerjakan perubahan transaksi kritis berpasangan.

**C — pemilik dan keterulangan setup:** pahami arti laporan, susun hitungan acuan, uji rekonsiliasi dan instalasi komputer kedua. Hasil review: definisi angka, UI/API terkait, tes, panduan setup dan bukti aktual.

Semua ikut memahami kebutuhan, meninjau kode anggota lain, menguji, serta mendokumentasikan bagiannya. Tidak ada anggota yang hanya menulis laporan. Titik integrasi bersama: kontrak API, satu dataset fiktif acuan, dan alur reservasi → DP → pelunasan → laporan.

## 7. Memakai AI secara bertanggung jawab

Contoh instruksi yang terarah:

> Baca AGENTS.md dan komponen Reservasi Saya. Jelaskan perilaku kosong sekarang. Ubah hanya pesan dan tautan pemulihannya sesuai kebutuhan berikut. Pertahankan aturan backend, tampilkan diff, jalankan pemeriksaan yang relevan pada database tes, lalu catat hasil yang benar-benar dijalankan.

Lu tetap perlu membaca diff, mengikuti satu alur data, memahami pesan error, dan membandingkan tes dengan kebutuhan. AI/skill/MCP membantu bekerja; mereka bukan sumber persetujuan kebijakan pengelola. Catat penggunaan AI dan kontribusi manusia sesuai kegiatan sebenarnya.

Keputusan kelompok/pengelola berikutnya: apakah demo dijadikan dasar, aturan tarif/DP/tenggat/refund, arti omzet, hak akses, data/bukti yang disimpan, peserta/instrumen UAT, pemeliharaan dan lingkungan penerapan. Deployment dan pembayaran nyata memerlukan kesepakatan terpisah.
