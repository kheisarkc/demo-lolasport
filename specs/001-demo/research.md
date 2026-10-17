# Research
- Boost 13.x dibaca: statefulApi, web guard, CSRF cookie/header, auth:sanctum dan DB transactions. MCP hanya read-only fondasi; saat tools hilang gunakan vendor lokal versi sama.
- Lock court → booking → payment menyelaraskan expiry/upload/cancel/master. Exclusion constraint PostgreSQL melindungi overlap independen aplikasi. Tidak pakai now() pada predikat constraint.
- Laravel 13 mengizinkan same-origin Fetch Metadata tanpa CSRF token; pengujian negatif memakai HTTP nyata tanpa Sec-Fetch-Site. Unit tests bypass CSRF.
- Timestamp UTC; batas filter dan kelompok laporan WIB. Next docs lokal setelah npm ci.
