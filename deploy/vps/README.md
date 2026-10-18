# Hosting demo pada VPS Linux

Konfigurasi ini menjalankan demo Laravel, Next.js, dan PostgreSQL pada satu VPS Linux dengan Docker Compose dan Caddy. Ini tetap simulasi dengan akun demo publik pada README utama, bukan sistem operasional pelanggan.

Sumber aplikasi memakai lockfile. Image dasar dipatok dengan digest. Database dan bukti pembayaran disimpan dalam volume terpisah yang bertahan saat container diganti. Source dan volume VPS terpisah dari data lokal Windows.

## Persiapan awal

1. Pastikan port internal 3001, 8001, dan 55433 belum dipakai. Jangan menimpa aplikasi/Caddyfile yang sudah ada.
2. Pasang Docker dan Compose dari sumber resmi. Salin source ke direktori khusus, misalnya `/opt/lola-sport-demo`.
3. Salin `.env.example` di folder ini menjadi `.env` **hanya pada server**, isi hostname, `APP_KEY` acak 32 byte dalam format `base64:...`, dan password database acak. Batasi izin file ke `600`. Jangan gunakan rahasia Windows atau memasukkannya ke Git.
4. Dari root source, gunakan perintah Compose berikut. Jalankan seed hanya pada database baru yang memang disiapkan untuk demo.

```bash
docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml up -d db
docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml build api
docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml run --rm api php artisan migrate --force --no-interaction
docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml run --rm api php artisan db:seed --force --no-interaction
docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml up -d api
docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml build web
docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml up -d web
```

5. Tambahkan site dari `Caddyfile.example` ke konfigurasi Caddy dengan hostname yang benar. Backup konfigurasi lama, validasi dengan `caddy validate`, lalu reload. DNS harus menunjuk ke VPS dan port 80/443 harus dapat diakses untuk HTTPS.
6. Periksa `/api/health`, katalog, login ketiga peran, dan akses tanpa login. Periksa layanan lama tetap merespons.

## Operasional

- Periksa `docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml ps` dan `logs --tail=50` dari root source. Output konfigurasi lengkap dapat berisi rahasia; jangan bagikan.
- Update source/image secara terarah, build berurutan agar RAM tidak habis, lalu `up -d`. Migrations yang dibutuhkan tetap memakai `migrate --force`, tanpa `fresh`, `reset`, atau `refresh`.
- `stop` menghentikan demo dengan mempertahankan volume. Jangan memakai `down -v`, `docker volume prune`, atau menghapus direktori data untuk update.
- Backup database memakai `pg_dump` dan backup volume `storage` sebelum perubahan skema/data. Simpan backup privat di luar Git, dan uji pemulihan sebelum mengandalkannya.
- Database/API/frontend hanya mendengarkan loopback; akses publik melalui Caddy. Host networking dipakai agar guard database lokal aplikasi tetap berlaku pada port 55433.
- Server, masa aktif VPS, kuota, domain/DNS, HTTPS, backup, dan kapasitas tetap harus dipantau. Jangan unggah data pribadi atau melakukan pembayaran nyata pada demo publik.

Vercel tidak diperlukan bila seluruh demo dijalankan dengan konfigurasi ini.
