'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cloneElement, ReactElement, ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { api, ApiError, labels } from '../app/lib';

export const dayKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export const addDays = (day: string, amount: number) => dayKey(new Date(new Date(`${day}T12:00:00+07:00`).getTime() + amount * 86400000));
export const dateLabel = (day: string) => { const date = new Date(`${day}T12:00:00+07:00`); return Number.isNaN(date.getTime()) ? day : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(date); };
export const timeLabel = (time: string) => new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(time));
export const holding = (status: string) => ['pending', 'review', 'confirmed'].includes(status);
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
  return now;
}
export function useQuery() {
  const params = useSearchParams(); const router = useRouter(); const pathname = usePathname();
  function update(values: Record<string, string | number | null>, push = false) {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => value === null ? next.delete(key) : next.set(key, String(value)));
    router[push ? 'push' : 'replace'](`${pathname}?${next}`, { scroll: false });
  }
  return { params, update };
}
export function useResource<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const key = `${path}:${version}`;
  const [state, setState] = useState<{ key: string; data?: T; error?: Error }>({ key: '' });
  useEffect(() => {
    if (!path) return;
    let active = true;
    api<T>(path).then(data => { if (active) setState({ key, data }); }).catch(error => { if (active) setState({ key, error }); });
    return () => { active = false; };
  }, [path, key]);
  return { data: state.key === key ? state.data : undefined, error: state.key === key ? state.error : undefined, loading: !!path && state.key !== key, refresh: useCallback(() => setVersion(v => v + 1), []) };
}
export function useAction() {
  const pending = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<Error | null>(null);
  async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null);
    try { return await work(); } catch (e) { setError(e instanceof Error ? e : new Error('Proses gagal. Silakan coba lagi.')); }
    finally { pending.current = false; setBusy(false); }
  }
  return { busy, error, run, clear: () => setError(null) };
}
export function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    court: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 9h4v6H3m18-6h-4v6h4"/><circle cx="12" cy="12" r="3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2m-8 3h2"/></>,
    check: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/></>,
    chart: <><path d="M4 3v18h17M8 17v-5m5 5V7m5 10V4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    home: <><path d="m3 10 9-7 9 7v11H3zM9 21v-8h6v8"/></>,
    arrow: <path d="m10 5 7 7-7 7M17 12H3"/>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.court}</svg>;
}
export function Badge({ value, children }: { value: string; children?: ReactNode }) { return <span className={`badge badge-${value}`}>{children || labels[value] || value}</span>; }
export function Heading({ title, text, action }: { title: string; text?: string; action?: ReactNode }) { return <div className="page-heading"><div><h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</div>; }
export function Loading({ text = 'Memuat data…' }: { text?: string }) { return <div className="loading-state" role="status"><span className="loading-dot"/>{text}</div>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty-state"><Icon name="court"/><h2>{title}</h2>{children}</div>; }
export function Failure({ error, retry }: { error?: Error | null; retry?: () => void }) {
  const pathname = usePathname(); const params = useSearchParams();
  if (!error) return null;
  const status = error instanceof ApiError ? error.status : 0;
  return <div className="message error" role="alert"><strong>{status === 404 ? 'Data tidak ditemukan' : status === 403 ? 'Akses tidak tersedia' : status === 401 || status === 419 ? 'Sesi perlu diperbarui' : 'Belum berhasil'}</strong><p>{error instanceof TypeError ? 'Koneksi ke layanan terputus. Periksa koneksi lalu coba lagi.' : error.message}</p><div className="actions">{[401, 419].includes(status) ? <Link className="button secondary" href={`/masuk?next=${encodeURIComponent(`${pathname}?${params}`)}`}>Masuk kembali</Link> : [403, 404].includes(status) ? <Link href="/" className="button secondary">Ke halaman utama</Link> : retry && <button className="secondary" onClick={retry}>Coba lagi</button>}</div></div>;
}
export function Field({ label, name, error, children, hint }: { label: string; name: string; error?: Error | null; children: ReactNode; hint?: string }) {
  const id = useId();
  const messages = error instanceof ApiError ? error.fields[name] : undefined;
  return <div className="field"><label htmlFor={id}>{label}</label>{cloneElement(children as ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, { id, 'aria-describedby': hint || messages ? `${id}-description` : undefined, 'aria-invalid': !!messages })}{(hint || messages) && <div id={`${id}-description`}>{hint && <small>{hint}</small>}{messages && <p className="field-error" role="alert">{messages.join(' ')}</p>}</div>}</div>;
}
export function SearchField({ label, value, placeholder, search }: { label: string; value: string; placeholder: string; search: (value: string) => void }) {
  const id = useId();
  return <form className="field" onSubmit={e => { e.preventDefault(); search(String(new FormData(e.currentTarget).get('query') || '')); }}><label htmlFor={id}>{label}</label><div className="search-control"><input key={value} id={id} name="query" type="search" defaultValue={value} placeholder={placeholder}/><button className="secondary">Cari</button></div></form>;
}
export function Dialog({ title, children, close, busy = false }: { title: string; children: ReactNode; close: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => { const node = ref.current; const previous = document.activeElement as HTMLElement; node?.showModal(); return () => { node?.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={e => { e.preventDefault(); if (!busy) close(); }}><div className="dialog-heading"><h2 id={id}>{title}</h2><button className="icon-button secondary" aria-label="Tutup dialog" disabled={busy} onClick={close}>×</button></div>{children}</dialog>;
}
export function DateStrip({ date, today, onChange }: { date: string; today: string; onChange: (value: string) => void }) {
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const validDate = !Number.isNaN(Date.parse(`${date}T12:00:00+07:00`));
  const dates = week.includes(date) || !validDate ? week : [...week.slice(0, 2), ...Array.from({ length: 5 }, (_, i) => addDays(date, i))].filter(value => value <= addDays(today, 90));
  return <section className="date-picker" aria-label="Pilih tanggal"><div className="date-picker-heading"><strong>{dateLabel(date)}</strong><label className="calendar-input">Tanggal<input aria-label="Tanggal bermain" type="date" value={date} min={today} max={addDays(today, 90)} onChange={e => { if (e.target.value) onChange(e.target.value); }}/></label></div><div className="date-strip">{dates.map(value => <button key={value} aria-pressed={date === value} className={date === value ? 'selected' : ''} onClick={() => onChange(value)}><span>{value === today ? 'Hari ini' : value === addDays(today, 1) ? 'Besok' : new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(`${value}T12:00:00+07:00`))}</span><strong>{value.slice(-2)}</strong></button>)}</div></section>;
}
