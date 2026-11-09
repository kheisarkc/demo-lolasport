'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, User } from '../app/lib';
import { Failure, Field, Heading, useAction } from './common';
import { homeFor, useAuth } from './shell';

export function safeNext(value: string | null) { return value && /^\/(reservasi\/LS-[A-Z0-9]+(?:\?|$)|pegawai(?:\/[^?#]*)?(?:\?|$)|pemilik\/(laporan|pengaturan)(?:\?|$)|akun(?:\?|$))/.test(value) && !value.includes('\\') ? value : null; }
/** Hanya penjaga dan pemilik yang masuk. Pelanggan memesan tanpa akun. */
export function AuthPage() {
  const action = useAction(); const auth = useAuth(); const router = useRouter(); const params = useSearchParams(); const next = safeNext(params.get('next'));
  return <section className="auth-page"><div className="auth-copy"><span className="brand-mark large" aria-hidden="true">L</span><Heading title="Masuk penjaga & pemilik" text="Pelanggan tidak perlu akun. Pesan langsung dari halaman jadwal."/><p className="desktop-only">Jadwal, verifikasi QRIS, dan laporan dalam satu tempat.</p></div><div className="surface auth-card"><h2>Masuk ke akun</h2><Failure error={action.error}/><form className="stack" onSubmit={e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); action.run(async () => { const user = await api<User>('/login', 'POST', data); auth.setUser(user); router.replace(next || homeFor(user)); }); }}>
    <fieldset className="stack form-fields" disabled={!auth.ready || action.busy}>
    <Field label="Email" name="email" error={action.error}><input name="email" type="email" autoComplete="email" required/></Field>
    <Field label="Kata sandi" name="password" error={action.error}><input name="password" type="password" minLength={10} autoComplete="current-password" required/></Field>
    <button disabled={action.busy}>{action.busy ? 'Memproses…' : 'Masuk'}</button>
    <Link className="button text-button" href="/">Saya pelanggan, lihat jadwal</Link>
    </fieldset></form><details className="demo-accounts"><summary>Akun demo untuk mencoba</summary><p>Penjaga: <code>pegawai@lola.test</code><br/>Pemilik: <code>pemilik@lola.test</code></p><p>Kata sandi: <code>DemoLola2026!</code></p><small>Gunakan data fiktif. Tidak ada pembayaran sungguhan.</small></details></div></section>;
}
