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
  const signIn = (data: Record<string, unknown>) => action.run(async () => { const user = await api<User>('/login', 'POST', data); auth.setUser(user); router.replace(next || homeFor(user)); });
  return <section className="auth-page"><div className="auth-copy"><span className="brand-mark large" aria-hidden="true">L</span><Heading title="Masuk penjaga & pemilik" text="Pelanggan tidak perlu akun. Pesan langsung dari halaman jadwal."/></div><div className="surface auth-card"><h2>Masuk ke akun</h2><Failure error={action.error}/><form className="stack" onSubmit={e => { e.preventDefault(); signIn(Object.fromEntries(new FormData(e.currentTarget))); }}>
    <fieldset className="stack form-fields" disabled={!auth.ready || action.busy}>
    <Field label="Email" name="email" error={action.error}><input name="email" type="email" autoComplete="email" required/></Field>
    <Field label="Kata sandi" name="password" error={action.error}><input name="password" type="password" minLength={10} autoComplete="current-password" required/></Field>
    <button disabled={action.busy}>{action.busy ? 'Memproses…' : 'Masuk'}</button>
    <Link className="button text-button" href="/">Saya pelanggan, lihat jadwal</Link>
    </fieldset></form><div className="demo-accounts"><span>Coba akun contoh</span><div className="actions">{([['pegawai@lola.test', 'Penjaga'], ['pemilik@lola.test', 'Pemilik']] as const).map(([email, label]) => <button key={email} type="button" className="secondary" disabled={!auth.ready || action.busy} onClick={() => signIn({ email, password: 'DemoLola2026!' })}>{label}</button>)}</div></div></div></section>;
}
