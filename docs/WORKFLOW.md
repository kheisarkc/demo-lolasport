# Alur eksekusi satu tugas

## Kontrak eksekusi
Jika pengguna meminta implementasi, jalankan pekerjaan yang diizinkan sampai hasilnya diuji dan dilaporkan.
Pembuatan rencana bukan akhir tugas. Tidak perlu menunggu persetujuan pada setiap tahap internal untuk perubahan lokal yang sudah diizinkan.
Pilihan bisnis material yang belum tersedia tetap memerlukan klarifikasi; kerjakan bagian independen sambil mencatat blocker.

## Fitur
1. Baca konteks dan kode; pahami kondisi awal dan perubahan pengguna yang belum di-commit.
2. Gunakan Spec Kit untuk spesifikasi, rencana, dan tugas. Baca `.agents/skills/speckit-*/SKILL.md` yang relevan, bukan seluruh katalog.
3. Simpan requirement IDs dan acceptance criteria di `specs/<nomor>-<fitur>/spec.md`.
4. Simpan rancangan teknis dan dampak kontrak/data di `plan.md`, lalu checklist implementasi di `tasks.md`.
5. Implementasikan potongan yang terhubung dari frontend sampai backend bila tugas membutuhkannya.
6. Gunakan Boost untuk fakta Laravel; gunakan Context7 hanya untuk dokumentasi tambahan yang relevan.
7. Jalankan pemeriksaan sesuai perubahan. Perubahan database diuji pada PostgreSQL; perubahan browser diuji dengan Playwright.
8. Lakukan review terhadap acceptance criteria dan diff. Perbaiki temuan, lalu ulang pemeriksaan yang terdampak.
9. Perbarui `docs/STATE.md` dan checklist tugas dengan bukti aktual.

## Bug
Reproduksi gejala, periksa log, bentuk hipotesis, uji akar penyebab, terapkan perbaikan terarah, dan cek gejala asli.
Skill `systematic-debugging` dan `verification-before-completion` tersedia untuk prosedurnya.
Jangan menutup bug hanya karena kode sudah diubah.

## Akhir sesi
Catat file/perilaku yang berubah, pemeriksaan dan hasilnya, bagian yang belum diuji, keputusan sementara, serta langkah aman berikutnya.
Jangan mengubah status UAT atau persetujuan pengelola tanpa bukti dari manusia.
Jangan push, merge, deploy, menghapus volume, menjalankan `migrate:fresh` pada database operasional, atau mengubah pembayaran tanpa otorisasi yang sesuai.

## Batas eksekusi tanpa pengawasan
Komputer dan aplikasi harus tetap berjalan, akun AI masih aktif, kuota tersedia, dan tool mengizinkan tindakan.
Launcher memakai sandbox workspace serta auto-review; penolakan izin tetap berlaku.
Tidak ada scheduler, loop tanpa batas, pembelian layanan, atau mode bypass yang dipasang.
