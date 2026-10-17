# API v1
JSON; 401/403/404/409/422; session cookie + X-XSRF-TOKEN mutasi.
- GET /courts?date=YYYY-MM-DD katalog/jadwal tanpa data pelanggan.
- GET /me, POST /register /login /logout.
- GET/POST /bookings, GET /bookings/{id}, POST /bookings/{id}/cancel.
- POST /bookings/{id}/payments multipart amount/method/proof; staff cash tanpa proof.
- POST /payments/{id}/review decision approved/rejected, reason wajib jika rejected.
- GET /payments/{id}/proof attachment privat pemilik booking/staff.
- GET/POST /staff/courts, PATCH /staff/courts/{id}.
- POST /staff/blocks; cancel booking membuka blok oleh staff.
- GET /reports?from=YYYY-MM-DD&to=YYYY-MM-DD owner, total/count/daily/monthly/transactions.
