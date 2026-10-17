'use client';

import Link from 'next/link';

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <section className="narrow surface stack" role="alert"><h1>Halaman belum dapat dibuka</h1><p>Coba muat kembali. Jika masih gagal, kembali ke halaman utama dan periksa layanan lokal.</p><div className="actions"><button onClick={retry}>Muat kembali halaman</button><Link className="button secondary" href="/">Ke halaman utama</Link></div></section>;
}
