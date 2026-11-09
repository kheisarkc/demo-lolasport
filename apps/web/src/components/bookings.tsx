'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError, Booking, bookingTokens, dateTime, labels, rupiah, saveBookingToken } from '../app/lib';
import { active as isActive, Badge, dateLabel, dayKey, Dialog, Empty, Failure, Field, Heading, holding, Loading, SearchField, timeLabel, useAction, useNow, useQuery, useResource } from './common';
import { PaymentForm, ProofPreview, ReviewPayment } from './payments';
import { Guard, useAuth } from './shell';

export function BookingCard({ booking, href }: { booking: Booking; href?: string }) {
  return <Link className="booking-card" href={href || `/reservasi/${booking.code}`}><div className="booking-date"><strong>{booking.play_date.slice(-2)}</strong><span>{new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(`${booking.play_date}T12:00:00+07:00`))}</span></div><div className="booking-card-main"><small>{booking.code} · {booking.source === 'block' ? 'Tutup lapangan' : booking.customer_name}</small><h3>{booking.court.name}</h3><p>{timeLabel(booking.starts_at)}–{timeLabel(booking.ends_at)} WIB</p><div className="badges"><Badge value={booking.status}/>{booking.source !== 'block' && <Badge value={booking.payment_status}/>}</div></div><div className="booking-card-end"><strong>{booking.source === 'block' ? 'Ditutup' : rupiah(booking.total)}</strong><span>Detail ›</span></div></Link>;
}

export function BookingsPage({ staff = false }: { staff?: boolean }) { return staff ? <Guard roles={['staff']}><StaffBookings/></Guard> : <CustomerBookings/>; }

/** Cek pesanan: pelanggan tanpa akun membuka pesanan dengan kode booking + nomor WhatsApp. */
function LookupForm({ code = '', onFound }: { code?: string; onFound?: () => void }) {
  const action = useAction(); const router = useRouter();
  return <form className="surface stack" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); action.run(async () => { const result = await api<{ code: string; access_token: string }>('/bookings/lookup', 'POST', { code: form.get('code'), customer_phone: form.get('customer_phone') }); saveBookingToken(result.code, result.access_token); if (onFound && result.code === code.toUpperCase()) onFound(); else router.push(`/reservasi/${result.code}`); }); }}>
    <Failure error={action.error}/>
    <Field label="Kode booking" name="code" error={action.error}><input name="code" defaultValue={code} placeholder="LS-XXXXXX" autoCapitalize="characters" required maxLength={12}/></Field>
    <Field label="Nomor WhatsApp" name="customer_phone" error={action.error}><input name="customer_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" required/></Field>
    <button disabled={action.busy}>{action.busy ? 'Mencari…' : 'Buka pesanan'}</button></form>;
}
function CustomerBookings() {
  const [state, setState] = useState<{ ready: boolean; bookings: Booking[] }>({ ready: false, bookings: [] });
  useEffect(() => { let alive = true; const codes = Object.keys(bookingTokens()); Promise.all(codes.map(code => api<Booking>(`/bookings/${code}`).catch(() => null))).then(list => { if (alive) setState({ ready: true, bookings: list.filter((b): b is Booking => !!b).sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)) }); }); return () => { alive = false; }; }, []);
  const lookup = <><div className="section-title"><h2>{state.bookings.length ? 'Pesanan lain' : 'Buka pesanan'}</h2></div><p className="muted">Pakai kode booking dan nomor WhatsApp saat memesan.</p><LookupForm/></>;
  return <section className="narrow"><Heading title="Cek pesanan"/>
    {!state.ready ? <Loading text="Memuat pesanan…"/> : state.bookings.length ? <><div className="section-title"><h2>Di perangkat ini</h2></div><div className="booking-list">{state.bookings.map(b => <BookingCard key={b.code} booking={b}/>)}</div>{lookup}</> : <>{lookup}<p className="muted">Belum pesan? <Link href="/">Lihat jadwal</Link></p></>}</section>;
}
function StaffBookings() {
  const resource = useResource<Booking[]>('/bookings'); const { params, update } = useQuery();
  const search = params.get('q') || ''; const status = params.get('status') || 'all'; const date = params.get('date') || ''; const page = Math.max(1, Number(params.get('page')) || 1);
  const filtered = resource.data?.filter(b => (status === 'all' || b.status === status) && (!date || b.play_date === date) && `${b.code} ${b.court.name} ${b.customer_name} ${b.customer_phone || ''}`.toLowerCase().includes(search.toLowerCase())) || [];
  const paged = filtered.slice((page - 1) * 10, page * 10);
  return <section><Heading title="Semua reservasi"/>
    <div className="filter-row"><SearchField label="Cari" value={search} placeholder="Kode, nama, WhatsApp" search={value => update({ q: value, page: null })}/><label className="field"><span>Status</span><select value={status} onChange={e => update({ status: e.target.value, page: null })}><option value="all">Semua status</option>{['pending', 'review', 'confirmed', 'checked_in', 'no_show', 'cancelled', 'expired'].map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></label><label className="field"><span>Tanggal main</span><input type="date" value={date} onChange={e => update({ date: e.target.value, page: null })}/></label></div>
    <Failure error={resource.error} retry={resource.refresh}/>{resource.loading ? <Loading text="Memuat reservasi…"/> : resource.error ? null : !filtered.length ? <Empty title={search || status !== 'all' || date ? 'Tidak ada hasil yang cocok' : 'Belum ada reservasi'}><p>Coba ubah pencarian atau filter.</p></Empty> : <><div className="booking-list">{paged.map(b => <BookingCard key={b.id} booking={b}/>)}</div>{filtered.length > 10 && <div className="pagination"><span>{filtered.length} reservasi · Halaman {page}</span><button className="secondary" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Sebelumnya</button><button className="secondary" disabled={page * 10 >= filtered.length} onClick={() => update({ page: page + 1 })}>Berikutnya</button></div>}</>}</section>;
}

function Deadline({ booking, refresh }: { booking: Booking; refresh: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Date.parse(booking.expires_at!) - Date.parse(booking.server_now || new Date().toISOString())));
  useEffect(() => { const anchor = performance.now(); const start = Math.max(0, Date.parse(booking.expires_at!) - Date.parse(booking.server_now || new Date().toISOString())); const timer = setInterval(() => { const value = Math.max(0, start - (performance.now() - anchor)); setRemaining(value); if (value === 0) { clearInterval(timer); refresh(); } }, 1000); return () => clearInterval(timer); }, [booking.expires_at, booking.server_now, refresh]);
  return <div className="deadline" role="timer" aria-live="off"><span>Sisa waktu bayar</span><strong>{Math.floor(remaining / 60000)}:{String(Math.floor(remaining / 1000) % 60).padStart(2, '0')}</strong><small>Sampai {timeLabel(booking.expires_at!)} WIB</small></div>;
}
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" className="secondary copy-button" onClick={() => { void navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => undefined); }}>{copied ? 'Tersalin' : 'Salin kode'}</button>;
}
export function BookingDetailPage({ id, verification = false }: { id: string; verification?: boolean }) { return verification ? <Guard roles={['staff']}><BookingDetail id={id} verification/></Guard> : <BookingDetail id={id} verification={false}/>; }
function BookingDetail({ id, verification }: { id: string; verification: boolean }) {
  const resource = useResource<Booking>(`/bookings/${id}`); const { user, ready } = useAuth(); const { params } = useQuery(); const router = useRouter(); const action = useAction(); const [confirm, setConfirm] = useState<'cancel' | 'check-in' | 'no-show' | null>(null); const [message, setMessage] = useState(''); const now = useNow();
  const b = resource.data; const staff = user?.role === 'staff';
  const queue = `/pegawai/verifikasi${params.get('q') ? `?q=${encodeURIComponent(params.get('q')!)}` : ''}`;
  const back = verification ? queue : staff ? '/pegawai/reservasi' : '/reservasi';
  function done(text: string) { setMessage(text); resource.refresh(); }
  if (resource.loading || !ready) return <Loading text="Memuat detail reservasi…"/>;
  if (resource.error instanceof ApiError && resource.error.status === 403 && !staff) return <section className="narrow"><Heading title="Buka pesanan" text="Pesanan ini belum tersimpan di perangkat ini."/><LookupForm code={id} onFound={resource.refresh}/></section>;
  if (resource.error) return <Failure error={resource.error} retry={resource.refresh}/>;
  if (!b) return null;
  const pending = b.payments.filter(p => p.status === 'pending'); const open = isActive(b.status); const block = b.source === 'block';
  const rejectedFirst = b.status === 'cancelled' && b.paid_amount === 0 ? b.payments.filter(p => p.status === 'rejected' && p.rejection_reason !== 'Reservasi dibatalkan sebelum verifikasi.').at(-1) : undefined;
  const guidance = b.status === 'expired' ? 'Bukti pembayaran tidak dikirim sampai batas waktu dan jamnya dilepas. Buat reservasi baru untuk memilih jadwal.'
    : rejectedFirst ? `Bukti DP ditolak: ${rejectedFirst.rejection_reason}. Pesanan dibatalkan dan jamnya dibuka lagi. Kalau uang sudah terkirim, chat penjaga dengan menyebut kode ${b.code}.`
    : b.status === 'cancelled' ? `Reservasi dibatalkan.${b.paid_amount ? ' Uang yang sudah dibayar tidak dikembalikan (DP hangus).' : ''}`
    : b.status === 'no_show' ? 'Pelanggan tidak datang. DP yang sudah dibayar hangus.'
    : b.status === 'checked_in' ? 'Pelanggan sudah hadir. Selamat bermain.'
    : pending.length ? 'Bukti sedang diperiksa penjaga. Pembayaran baru diterima setelah disetujui.'
    : b.payment_status === 'paid' ? 'Tagihan sudah lunas. Tunjukkan kode booking ke penjaga saat datang.'
    : b.status === 'confirmed' ? `Jadwal aman. Sisa ${rupiah(b.total - b.paid_amount)} dibayar sebelum main, lewat QRIS di sini atau tunai di tempat.`
    : 'Bayar lalu kirim bukti sebelum waktu habis supaya jadwal tetap ditahan.';
  const canCancel = open && Date.parse(b.starts_at) > now && (staff || (b.status === 'pending' && !b.payments.length));
  const canCheckIn = staff && b.status === 'confirmed' && !block && now >= Date.parse(b.starts_at) - 3600000 && now < Date.parse(b.ends_at);
  const canNoShow = staff && b.status === 'confirmed' && !block && now >= Date.parse(b.starts_at);
  const dialog = { cancel: { title: block ? 'Buka jam yang ditutup?' : 'Batalkan reservasi ini?', text: block ? 'Jam ini bisa dipesan lagi.' : `Jam akan dilepas.${b.paid_amount ? ` Uang ${rupiah(b.paid_amount)} tidak dikembalikan.` : ''}`, path: 'cancel', ok: block ? 'Jam dibuka lagi.' : 'Reservasi dibatalkan dan slot dilepas.', button: block ? 'Ya, buka jam' : 'Ya, batalkan' }, 'check-in': { title: 'Tandai hadir?', text: 'Pelanggan sudah datang dan tagihan lunas. Jam selesai tetap.', path: 'check-in', ok: 'Pelanggan ditandai hadir.', button: 'Ya, hadir' }, 'no-show': { title: 'Tandai tidak datang?', text: `DP ${rupiah(b.paid_amount)} hangus dan tidak dikembalikan.`, path: 'no-show', ok: 'Ditandai tidak datang.', button: 'Ya, tidak datang' } };
  const schedule = <section className="surface stack schedule-card"><div className="schedule-head"><div><h2>{verification ? b.court.name : 'Jadwal main'}</h2><p>{block ? 'Tutup lapangan' : b.customer_name}{staff && b.customer_phone ? ` · ${b.customer_phone}` : ''}</p></div><div className="badges"><Badge value={b.status}/>{!block && <Badge value={b.payment_status}/>}</div></div><div className="schedule-line"><strong>{dateLabel(b.play_date)}</strong><span>{timeLabel(b.starts_at)}–{timeLabel(b.ends_at)} WIB · {(Date.parse(b.ends_at) - Date.parse(b.starts_at)) / 3600000} jam{dayKey(new Date(b.starts_at)) !== b.play_date ? ' (dini hari)' : ''}</span></div>{!block && <p className="guidance">{guidance}</p>}{b.reason && <p>Alasan tutup: {b.reason}</p>}{b.status === 'pending' && b.expires_at && <Deadline booking={b} refresh={resource.refresh}/>}</section>;

  if (verification) return <section className="narrow"><Link className="back-link" href={back}>‹ Kembali ke antrean</Link><Heading title="Periksa bukti pembayaran"/>{pending.length ? pending.map(payment => <ReviewPayment key={payment.id} payment={payment} booking={b} onDone={text => router.push(`${queue}${queue.includes('?') ? '&' : '?'}ok=${encodeURIComponent(text)}`)}/>) : <div className="message success" role="status">Bukti pesanan ini sudah diperiksa.</div>}{schedule}<Link className="text-link" href={`/reservasi/${b.code}`}>Buka detail lengkap pesanan ›</Link></section>;

  return <section><Link className="back-link" href={back}>‹ {staff ? 'Semua reservasi' : 'Cek pesanan'}</Link><Heading title={b.court.name} text={`Kode booking ${b.code}${staff ? ` · ${labels[b.source]}` : ''}`}/>{message && <div className="message success" role="status">{message}</div>}{params.get('created') && !message && <div className="message success code-callout" role="status"><p>Reservasi dibuat. Simpan kode <strong>{b.code}</strong> untuk membuka pesanan lagi.</p><CopyCode code={b.code}/></div>}
    <div className="detail-grid"><div className="stack">{schedule}
    {!block && <section className="surface"><h2>Tagihan</h2><dl className="definition-list"><div><dt>Total</dt><dd>{rupiah(b.total)}</dd></div><div><dt>Sudah diterima</dt><dd data-testid="paid-amount">{rupiah(b.paid_amount)}</dd></div><div className="total-line"><dt>Sisa</dt><dd>{rupiah(b.total - b.paid_amount)}</dd></div></dl></section>}
    {!block && !!b.payments.length && <section className="surface stack"><h2>Riwayat pembayaran</h2>{b.payments.map(p => <article className="payment-history" key={p.id}><div className="section-title"><strong>{rupiah(p.amount)}</strong><Badge value={p.status}>{p.status === 'pending' ? 'Menunggu verifikasi' : labels[p.status]}</Badge></div><p>{labels[p.method]}{p.has_proof ? ' · bukti dari web' : ' · dicatat di tempat'} · {dateTime(p.reviewed_at || p.created_at)} WIB</p>{p.rejection_reason && <p className="field-error">Alasan penolakan: {p.rejection_reason}</p>}<ProofPreview payment={p} code={b.code}/></article>)}</section>}
    {staff && <details className="surface audit"><summary>Jejak aktivitas ({b.events.length})</summary><ol className="timeline">{b.events.map(event => <li key={event.id}><strong>{labels[event.action] || event.action}</strong><small>{event.metadata.actor} · {dateTime(event.created_at)} WIB</small>{event.metadata.reason && <p>{event.metadata.reason}</p>}</li>)}</ol></details>}</div>
    <aside className="stack">{!block && open && b.paid_amount < b.total && !pending.length && <PaymentForm key={`${b.id}-${b.paid_amount}-${b.payments.length}`} booking={b} staff={staff} onDone={done}/>}{!block && open && !!pending.length && <section className="surface stack"><h2>Menunggu verifikasi</h2><p>Bukti sudah terkirim. Status berubah setelah penjaga memeriksa.</p>{staff ? <Link className="button" href={`/pegawai/verifikasi/${b.code}`}>Periksa bukti</Link> : <button className="secondary" onClick={resource.refresh}>Periksa status</button>}</section>}
      {(canCheckIn || canNoShow) && <section className="surface stack"><h2>Kedatangan</h2><p>{b.payment_status === 'paid' ? 'Tandai hadir saat pelanggan datang (paling cepat 60 menit sebelum main).' : 'Lunasi dulu sisa tagihan sebelum menandai hadir.'}</p><Failure error={action.error}/>{canCheckIn && <button disabled={b.payment_status !== 'paid'} onClick={() => setConfirm('check-in')}>Hadir</button>}{canNoShow && <button className="danger" onClick={() => setConfirm('no-show')}>Tidak datang</button>}</section>}
      {canCancel && <section className="surface stack"><h2>{block ? 'Buka kembali jam' : 'Batalkan reservasi'}</h2><p>{block ? 'Jam dibuka dan bisa dipesan lagi.' : staff ? 'Hanya sebelum jam mulai. Uang yang sudah diterima tidak dikembalikan.' : 'Bisa dibatalkan sendiri selama belum membayar. Setelah membayar, hubungi penjaga.'}</p><Failure error={action.error}/><button className="danger" onClick={() => setConfirm('cancel')}>{block ? 'Buka jam' : 'Batalkan reservasi'}</button></section>}
      {!holding(b.status) && <Link className="button" href={staff ? '/pegawai/jadwal' : '/'}>Pilih jadwal baru</Link>}</aside></div>
    {confirm && <Dialog title={dialog[confirm].title} close={() => setConfirm(null)} busy={action.busy}><p>{b.court.name} · {dateTime(b.starts_at)} WIB</p><p>{dialog[confirm].text}</p><Failure error={action.error}/><div className="actions"><button className="secondary" disabled={action.busy} onClick={() => setConfirm(null)}>Kembali</button><button className={confirm === 'check-in' ? '' : 'danger filled'} disabled={action.busy} onClick={() => action.run(async () => { await api(`/bookings/${b.code}/${dialog[confirm].path}`, 'POST'); const ok = dialog[confirm].ok; setConfirm(null); done(ok); })}>{action.busy ? 'Memproses…' : dialog[confirm].button}</button></div></Dialog>}
  </section>;
}
