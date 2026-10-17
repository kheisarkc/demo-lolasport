# Mulai dari demo

Ruang lingkup demo lengkap: akun, lapangan/jadwal, reservasi, pembayaran manual dan penerimaan. Status aktual pada STATE.md; keputusan simulasi pada DEMO-ASSUMPTIONS.md. Sumber fondasi lama bukan bukti verifikasi demo.

1. Baca AGENTS.md, PROJECT.md, DECISIONS.md dan STATE.md.
2. Jalankan `npm run dev`, buka http://127.0.0.1:3001.
3. Gunakan akun dan skenario README.md.
4. Untuk perubahan fitur ikuti WORKFLOW.md dan specs/001-demo.

Perintah: `npm run doctor`, `npm run check`, `npm run test:e2e`, `npm run api -- route:list`, `npm run db:stop`.
Database demo `lola_demo`, tes `lola_demo_test`, port 55433. API 8001, web 3001. Rahasia/runtime/upload/hasil tes tidak masuk Git. Tidak ada PDF atau ekstraksi proposal yang disimpan dalam source.

Untuk UI terbaru lihat specs/002-mobile-redesign. Jalur awal pegawai /pegawai, pemilik /pemilik/laporan, pelanggan /. E2E sekarang memakai layanan/database tes terisolasi; jangan jalankan bersamaan dengan backend check.
