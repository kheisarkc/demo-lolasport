# Feature Specification: Berbagi demo dan panduan kelompok

**Created**: 2026-10-18
**Status**: Diizinkan pengguna untuk dokumentasi dan push ke repo demo.
**Input**: Bagikan demo yang sudah ada agar anggota kelompok dapat mencoba, memahami, dan mengubahnya secara terstruktur.

## User Scenarios & Testing

### US1 Anggota baru mencoba aplikasi (P1)
Anggota menemukan prasyarat, mengambil source, menyiapkan konfigurasi sendiri, menjalankan aplikasi, lalu mencoba tiga peran dengan data fiktif.
Acceptance: README mengarah ke petunjuk Windows dari clone sampai halaman terbuka; akun, skenario, efek perintah, pemecahan masalah, serta batas dukungan tercantum. Tidak memerlukan akun AI untuk menggunakan aplikasi.

### US2 Anggota memahami dan mengubah fitur (P1)
Anggota mengikuti satu alur layar sampai laporan, menemukan file yang bertanggung jawab, membuat perubahan kecil di branch, dan memilih pemeriksaan sesuai dampaknya.
Acceptance: peta kode memakai tautan relatif yang valid; kontribusi menjelaskan Git, perubahan kebutuhan, review, tes terisolasi, serta contoh latihan tanpa mengubah aturan bisnis diam-diam.

### US3 Pengguna membagikan versi yang dapat ditelusuri (P1)
Source dan panduan tersedia pada branch utama repo tujuan, dengan riwayat awal dipertahankan dan tanpa rahasia/data lokal.
Acceptance: remote diperiksa sebelum push; tidak force push; file sensitif dan riwayat publikasi diperiksa; commit remote setelah push sama dengan versi yang diserahkan. Hasil pemeriksaan baru dipisahkan dari laporan lama.

### Edge Cases
Program belum terpasang, PHP XAMPP lebih dahulu di PATH, Docker belum berjalan, port terpakai, Windows belum memakai PowerShell 7, anggota tanpa akses tulis repo, sistem operasi lain, database lokal sudah ada, remote berubah selama pengerjaan, izin push ditolak.

## Requirements
- FR-001: Jalur mulai, mencoba, memahami, mengubah, dan memeriksa tersedia dalam bahasa Indonesia yang ramah pemula.
- FR-002: Panduan membedakan source GitHub dengan aplikasi terpasang, serta data seed dengan transaksi lokal yang tidak dibagikan.
- FR-003: Batas demo, aturan sementara, bukti tes, dan UAT yang belum dilakukan tetap jelas.
- FR-004: Perintah mengikuti launcher dan guard aktual; tidak mengajarkan reset database operasional atau berbagi rahasia.
- FR-005: Publikasi hanya ke repo yang diminta, mempertahankan riwayat dan pekerjaan remote, tanpa deployment.

## Success Criteria
- SC-001: Tautan lokal pada panduan yang ditambahkan/diubah menunjuk file atau folder yang ada.
- SC-002: Anggota dapat menemukan setup, tiga akun, satu alur contoh, peta source, serta prosedur perubahan dari README.
- SC-003: Pemeriksaan yang dijalankan dan batas pengujian komputer baru dicatat secara eksplisit.
- SC-004: Versi pada repo tujuan cocok dengan commit penyerahan yang diperiksa.

## Assumptions
- Panduan awal menargetkan Windows karena launcher bootstrap yang tersedia berbentuk PowerShell; instalasi mesin anggota dan OS lain belum diuji.
- Pengguna mengizinkan push pada pesan ini, menggantikan larangan push untuk tahap eksperimen sebelumnya. Tidak ada izin deployment atau pembayaran nyata.
- Fitur dan aturan bisnis tidak diubah pada tugas dokumentasi ini.
