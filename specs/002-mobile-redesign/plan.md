# Implementation Plan: Redesign mobile
## Summary / Technical context
Evolusi frontend Next16.4.2/React19.3 pada repo sama; Laravel13.37/Sanctum4.3/PostgreSQL17 tetap. Tanpa dependency baru atau migrasi. Server aktif3001/8001 telah diverifikasi command line ke demo ini. Git awal bersih09e84d0.
## Constitution check
Lulus sebelum/sesudah desain: rules/roles tidak berubah; perubahan API additive; E2E khusus lola_demo_test; tanpa parent edits/push/deploy. Tidak ada extension hooks.
## Design tokens
Lapangan hijau #136348; tinta #18382f; kanvas #f3f6f4; putih #ffffff; garis #cbd7cf; aksen kuning lapangan #f0ce67. Status amber/danger memakai teks kontras. Font Bahnschrift untuk heading pendek (fallback Segoe UI), Segoe UI untuk teks; tabular-nums waktu/uang. Spacing4/8/12/16/24/32; radius8 kontrol,16 surface utama,24 dialog. Ikon SVG orisinal sederhana +label.
## Layout / critique
Mobile: header merek+demo → judul tugas → filter → konten → bottom nav. Katalog slot adalah titik visual utama, bukan hero. Sticky selection di atas nav; checkout form fokus. Staff agenda vertical per court, desktop kolom lebih lebar; verifikasi bukti+angka/action. Owner kartu transaksi bukan tabel menyusut. Tipografi kiri, nominal rata kanan.
Rencana ditinjau terhadap brief: membuang banner/pitch dekoratif dan kumpulan kartu statistik tanpa fungsi; warna hijau mengingatkan garis lapangan, strip tanggal dan grid slot menjadi identitas fungsional.
## Structure
apps/web/src/components/{shell,common,catalog,checkout,auth,bookings,payments,staff,master,reports}.tsx. App Router pages /, /masuk, /daftar, /checkout, /reservasi, /reservasi/[id], /pegawai, /pegawai/jadwal, /pegawai/reservasi, /pegawai/verifikasi, /pegawai/verifikasi/[id], /pegawai/lapangan, /pemilik/laporan, /akun. Shared client AuthProvider and URL state, backend remains authoritative.
## Backend
Add slot status/server_now and booking server_now. Reports add kind/totals_by_kind from complete approved history. Proof preview uses authorized fetch Blob, no public file route. Existing guards preserved.
## Testing / delivery
Read-only before captures in .runtime/reports/redesign/before. Dedicated browser services3002/8002 use guarded test database; APP_ENV=e2e preserves real CSRF, own cookies/storage/build dir. No operational reset. Backend contract tests first; 3 key UI flows first; expand full UI; check/E2E + width matrix + after captures. Each stage persists STATE/tasks.
