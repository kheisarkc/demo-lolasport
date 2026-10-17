'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, ApiError, labels, User } from '../app/lib';
import { Empty, Failure, Icon, Loading, useAction } from './common';

const Auth = createContext<{ user: User | null; ready: boolean; error: Error | null; setUser: (user: User | null) => void; reload: () => void }>({ user: null, ready: false, error: null, setUser: () => {}, reload: () => {} });
export const useAuth = () => useContext(Auth);
export const homeFor = (user: User) => user.role === 'staff' ? '/pegawai' : user.role === 'owner' ? '/pemilik/laporan' : '/';
export function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false); const [error, setError] = useState<Error | null>(null); const [version, setVersion] = useState(0);
  const pathname = usePathname();
  useEffect(() => { let active = true; api<User>('/me').then(value => { if (active) { setUser(value); setError(null); } }).catch(e => { if (active) { if (e instanceof ApiError && e.status === 401) { setUser(null); setError(null); } else setError(e); } }).finally(() => { if (active) setReady(true); }); return () => { active = false; }; }, [version]);
  const nav = user?.role === 'staff' ? [['/pegawai', 'Hari ini', 'home'], ['/pegawai/jadwal', 'Jadwal', 'calendar'], ['/pegawai/verifikasi', 'Verifikasi', 'check'], ['/pegawai/lapangan', 'Lapangan', 'court'], ['/akun', 'Akun', 'user']] : user?.role === 'owner' ? [['/pemilik/laporan', 'Penerimaan', 'chart'], ['/akun', 'Akun', 'user']] : [['/', 'Cari jadwal', 'court'], ['/reservasi', 'Reservasi', 'calendar'], ['/akun', 'Akun', 'user']];
  return <Auth.Provider value={{ user, ready, error, setUser: account => { setUser(account); setError(null); setReady(true); }, reload: () => setVersion(v => v + 1) }}><a className="skip-link" href="#main">Lewati ke konten</a><header className="app-header"><Link className="brand" href={user ? homeFor(user) : '/'}><span className="brand-mark" aria-hidden="true">L</span><span>Lola<span className="brand-light">Sport</span></span></Link><div className="header-meta"><span className="demo-label">Demo lokal</span><span className="desktop-only">{user ? labels[user.role] : 'Futsal & badminton'}</span></div></header><div className="app-body"><nav className="app-nav" aria-label="Navigasi utama">{nav.map(([href, title, icon]) => <Link key={href} href={href} aria-current={pathname === href || (href === '/reservasi' && pathname.startsWith('/reservasi/')) || (href === '/pegawai/verifikasi' && pathname.startsWith(`${href}/`)) ? 'page' : undefined}><Icon name={icon}/><span>{title}</span></Link>)}</nav><main id="main" tabIndex={-1}>{children}</main></div><footer className="app-footer">Simulasi lokal · Tanpa pembayaran sungguhan · Belum UAT pengelola</footer></Auth.Provider>;
}
export function Guard({ roles, children }: { roles: User['role'][]; children: ReactNode }) {
  const auth = useAuth(); const pathname = usePathname(); const params = useSearchParams();
  if (!auth.ready) return <Loading text="Memeriksa sesi…"/>;
  if (auth.error) return <Failure error={auth.error} retry={auth.reload}/>;
  if (!auth.user) return <Empty title="Masuk untuk melanjutkan"><p>Masuk dengan akun Anda. Pilihan dan alamat tujuan akan dipertahankan.</p><Link className="button" href={`/masuk?next=${encodeURIComponent(`${pathname}${params.size ? `?${params}` : ''}`)}`}>Masuk / daftar</Link></Empty>;
  if (!roles.includes(auth.user.role)) return <Empty title="Halaman untuk peran lain"><p>Akun Anda adalah {labels[auth.user.role].toLowerCase()}.</p><Link className="button" href={homeFor(auth.user)}>Ke halaman utama</Link></Empty>;
  return children;
}
export function Account() {
  const auth = useAuth(); const action = useAction(); const router = useRouter();
  if (!auth.ready) return <Loading/>;
  return <section className="narrow"><h1>Akun Anda</h1>{auth.user ? <div className="surface stack"><Icon name="user"/><h2>{auth.user.name}</h2><p>{auth.user.email}</p><p><span className="badge">{labels[auth.user.role]}</span></p><Failure error={action.error}/><button className="secondary" disabled={action.busy} onClick={() => action.run(async () => { await api('/logout', 'POST'); auth.setUser(null); router.replace('/masuk'); })}>{action.busy ? 'Keluar…' : 'Keluar'}</button></div> : <div className="surface stack"><p>Masuk untuk mengelola reservasi dan pembayaran.</p><Link className="button" href="/masuk">Masuk / daftar</Link></div>}<p className="fine-print">Gunakan data fiktif. Seluruh transaksi dalam aplikasi ini adalah simulasi.</p></section>;
}
export function RoleHome({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth(); const router = useRouter();
  useEffect(() => { if (user && user.role !== 'customer') router.replace(homeFor(user)); }, [user, router]);
  return ready && (!user || user.role === 'customer') ? children : <Loading/>;
}
