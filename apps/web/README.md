# Web demo

Next.js App Router 16.4.2 + TypeScript. Jalankan dari root monorepo dengan `npm run dev` agar API dan database demo juga aktif. Web pada http://127.0.0.1:3001, Laravel di 8001.

Browser mengakses proxy `/api/v1/*` dan `/sanctum/*`; aturan bisnis berada di Laravel. Auth memakai cookie/session Sanctum dan CSRF, tanpa token localStorage. Panduan akun, setup dan verifikasi ada di README root.
