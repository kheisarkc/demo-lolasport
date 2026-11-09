'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError, Booking, Catalog, hourText, rupiah, saveBookingToken } from '../app/lib';
import { availableDurations } from './catalog';
import { dateLabel, Empty, Failure, Field, Heading, Loading, useAction, useResource } from './common';
import { RoleHome } from './shell';

/** Pelanggan memesan tanpa akun: cukup nama dan nomor WhatsApp. */
export function CheckoutPage() { return <RoleHome><CheckoutContent/></RoleHome>; }
function CheckoutContent() {
  const params = useSearchParams(); const router = useRouter(); const action = useAction();
  const date = params.get('date') || ''; const courtId = Number(params.get('court')); const hour = Number(params.get('hour')); const duration = Number(params.get('duration'));
  const resource = useResource<Catalog>(`/courts?date=${encodeURIComponent(date)}`); const court = resource.data?.courts.find(c => c.id === courtId);
  const valid = court && availableDurations(court, hour).includes(duration);
  const back = `/?${new URLSearchParams({ date, court: String(courtId), hour: String(hour), duration: String(duration) })}`;
  if (resource.loading) return <Loading text="Memeriksa harga dan ketersediaan…"/>;
  if (resource.error) return <Failure error={resource.error} retry={resource.refresh}/>;
  if (!valid) return <Empty title="Jam ini sudah tidak tersedia"><p>Pilih jam lain. Reservasi belum dibuat.</p><Link className="button" href={back}>Pilih jadwal lain</Link></Empty>;
  const total = court.hourly_rate * duration; const dp = Math.ceil(total * resource.data!.dp_percent / 100);
  return <section className="narrow"><Link className="back-link" href={back}>‹ Ubah jadwal</Link><Heading title="Periksa reservasimu"/><Failure error={action.error}/>{action.error instanceof ApiError && action.error.status === 409 && <Link className="button secondary" href={back}>Pilih jadwal lain</Link>}
    <div className="surface checkout-summary"><small>{court.sport === 'futsal' ? 'Futsal' : 'Badminton'}</small><h2>{court.name}</h2><p className="checkout-when"><strong>{dateLabel(date)}</strong> · {hourText(hour)}–{hourText(hour + duration)} WIB · {duration} jam</p><dl className="definition-list"><div className="total-line"><dt>Total sewa</dt><dd>{rupiah(total)}</dd></div><div><dt>DP minimal ({resource.data!.dp_percent}%)</dt><dd>{rupiah(dp)}</dd></div></dl></div>
    <form className="surface stack" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); action.run(async () => {
      const booking = await api<Booking>('/bookings', 'POST', { court_id: courtId, date, hour, duration, customer_name: form.get('customer_name'), customer_phone: form.get('customer_phone') });
      saveBookingToken(booking.code, booking.access_token!); router.push(`/reservasi/${booking.code}?created=1`);
    }); }}>
      <h2>Data pemesan</h2>
      <Field label="Nama pemesan" name="customer_name" error={action.error}><input name="customer_name" autoComplete="name" minLength={2} maxLength={80} required/></Field>
      <Field label="Nomor WhatsApp" name="customer_phone" error={action.error} hint="Dipakai bersama kode booking untuk membuka pesanan lagi."><input name="customer_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" required/></Field>
      <p className="rules-note">Setelah pesan, bayar DP atau lunas lewat QRIS dan unggah bukti dalam {resource.data!.hold_minutes} menit, kalau lewat jamnya dilepas. Bukti DP yang ditolak membatalkan pesanan. DP tidak dikembalikan bila batal atau tidak datang.</p>
      <button disabled={action.busy}>{action.busy ? 'Mengamankan jadwal…' : 'Pesan sekarang'}</button></form>
  </section>;
}
