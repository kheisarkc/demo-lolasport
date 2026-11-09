#!/usr/bin/env bash
# Perbarui demo di VPS dari branch main GitHub.
# Jalankan dari mana saja:  sudo bash /opt/lola-sport-demo/deploy/vps/update.sh
# Database dibuat ulang hanya bila FRESH=1 (perlu saat skema berubah besar):
#                           sudo FRESH=1 bash /opt/lola-sport-demo/deploy/vps/update.sh
# Selalu backup database (pg_dump) dan source lama dulu. File rahasia deploy/vps/.env tidak disentuh.
set -euo pipefail

APP=/opt/lola-sport-demo
BACKUPS=/opt/lola-backups
REPO=https://codeload.github.com/kheisarkc/demo-lolasport/tar.gz/refs/heads/main
STAMP=$(date +%Y%m%d-%H%M%S)
C="docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml"

mkdir -p "$BACKUPS"
cd "$APP"
echo "== Backup database dan source ($STAMP)"
$C exec -T db pg_dump -h 127.0.0.1 -p 55433 -U lola lola_demo > "$BACKUPS/lola_demo-$STAMP.sql"
tar -czf "$BACKUPS/source-$STAMP.tar.gz" --exclude=./node_modules -C "$APP" .
chmod 600 "$BACKUPS"/*

echo "== Ambil source terbaru"
NEW=$(mktemp -d)
curl -fsSL "$REPO" | tar -xz -C "$NEW" --strip-components=1
rsync -a --delete --exclude=/deploy/vps/.env --exclude=/.env --exclude=/.deployed-source "$NEW/" "$APP/"
rm -rf "$NEW"
date -u +"main %Y-%m-%dT%H:%M:%SZ" > "$APP/.deployed-source"

echo "== Build dan migrasi"
$C build api
if [ "${FRESH:-0}" = "1" ]; then
  $C run --rm api php artisan migrate:fresh --seed --force --no-interaction
else
  $C run --rm api php artisan migrate --force --no-interaction
fi
$C up -d api
$C build web
$C up -d web

echo "== Cek"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8001/api/v1/health; then echo; echo "SELESAI. Backup: $BACKUPS/*-$STAMP.*"; exit 0; fi
  sleep 2
done
echo "API belum sehat. Lihat: $C logs --tail=50 api" >&2
exit 1
