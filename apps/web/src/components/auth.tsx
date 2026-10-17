'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, User } from '../app/lib';
import { Failure, Field, Heading, useAction } from './common';
import { homeFor, useAuth } from './shell';

export function safeNext(value: string | null) { return value && /^\/(checkout(?:\?|$)|reservasi(?:\/\d+)?(?:\?|$)|pegawai(?:\/[^?#]*)?(?:\?|$)|pemilik\/laporan(?:\?|$)|akun(?:\?|$))/.test(value) && !value.includes('\\') ? value : null; }
export function AuthPage({ register = false }: { register?: boolean }) {
  const action = useAction(); const auth = useAuth(); const router = useRouter(); const params = useSearchParams(); const next = safeNext(params.get('next'));
  return <section className="auth-page"><div className="auth-copy"><span className="brand-mark large" aria-hidden="true">L</span><Heading title={register ? 'Siap punya jadwal main?' : 'Masuk, lanjutkan main.'} text={next?.startsWith('/checkout') ? 'Pilihan jadwalmu tersimpan. Periksa kembali di checkout setelah masuk.' : 'Reservasi dan pembayaran simulasi, dalam satu tempat.'}/><p className="desktop-only">Futsal atau badminton. Pilih waktunya, siapkan timnya.</p></div><div className="surface auth-card"><h2>{register ? 'Daftar pelanggan' : 'Masuk ke akun'}</h2><Failure error={action.error}/><form className="stack" onSubmit={e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); action.run(async () => { const user = await api<User>(register ? '/register' : '/login', 'POST', data); auth.setUser(user); router.replace(user.role === 'customer' ? next || '/' : homeFor(user)); }); }}>
    <fieldset className="stack form-fields" disabled={!auth.ready || action.busy}>{register && <Field label="Nama fiktif" name="name" error={action.error}><input name="name" autoComplete="name" required maxLength={80}/></Field>}
    <Field label="Email" name="email" error={action.error}><input name="email" type="email" autoComplete="email" required/></Field>
    <Field label="Kata sandi" name="password" error={action.error} hint={register ? 'Minimal 10 karakter.' : undefined}><input name="password" type="password" minLength={10} autoComplete={register ? 'new-password' : 'current-password'} required/></Field>
    {register && <Field label="Ulangi kata sandi" name="password_confirmation" error={action.error}><input name="password_confirmation" type="password" minLength={10} autoComplete="new-password" required/></Field>}
    <button disabled={action.busy}>{action.busy ? 'Memproses…' : register ? 'Buat akun' : 'Masuk'}</button>
    <Link className="button text-button" href={`${register ? '/masuk' : '/daftar'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}>{register ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}</Link>
    </fieldset></form><details className="demo-accounts"><summary>Akun demo untuk mencoba</summary><p>Pelanggan: <code>pelanggan@lola.test</code><br/>Pegawai: <code>pegawai@lola.test</code><br/>Pemilik: <code>pemilik@lola.test</code></p><p>Kata sandi: <code>DemoLola2026!</code></p><small>Gunakan data fiktif. Tidak ada pembayaran sungguhan.</small></details></div></section>;
}
