import Link from 'next/link';

export default function NotFound() {
  return <section className="narrow surface stack"><h1>Halaman tidak ditemukan</h1><p>Alamat ini tidak tersedia. Kembali ke halaman utama untuk memilih jadwal atau membuka pekerjaan Anda.</p><Link className="button" href="/">Ke halaman utama</Link></section>;
}
