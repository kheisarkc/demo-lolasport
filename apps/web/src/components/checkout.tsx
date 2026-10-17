'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError, Booking, Catalog, hourText, rupiah } from '../app/lib';
import { availableDurations } from './catalog';
import { dateLabel, Empty, Failure, Heading, Loading, useAction, useResource } from './common';
import { Guard } from './shell';

export function CheckoutPage() { return <Guard roles={['customer']}><CheckoutContent/></Guard>; }
function CheckoutContent() {
  const params = useSearchParams(); const router = useRouter(); const action = useAction(); const [checked, setChecked] = useState(false); const [priceChanged, setPriceChanged] = useState(false);
  const date = params.get('date') || ''; const courtId = Number(params.get('court')); const hour = Number(params.get('hour')); const duration = Number(params.get('duration'));
  const resource = useResource<Catalog>(`/courts?date=${encodeURIComponent(date)}`); const court = resource.data?.courts.find(c => c.id === courtId);
  const valid = court && availableDurations(court, hour).includes(duration);
  const back = `/?${new URLSearchParams({ date, court: String(courtId), hour: String(hour), duration: String(duration) })}`;
  if (resource.loading) return <Loading text="Memeriksa harga dan ketersediaan…"/>;
  if (resource.error) return <Failure error={resource.error} retry={resource.refresh}/>;
  if (!valid) return <Empty title="Slot ini sudah tidak tersedia"><p>Pilih jam lain. Reservasi belum dibuat.</p><Link className="button" href={back}>Pilih jadwal lain</Link></Empty>;
  const total = court.hourly_rate * duration; const dp = Math.ceil(total * resource.data!.dp_percent / 100);
  return <section className="narrow"><Link className="back-link" href={back}>‹ Ubah pilihan jadwal</Link><Heading title="Periksa reservasimu" text="Pastikan tanggal, jam, dan tagihan sudah sesuai."/><Failure error={action.error} retry={resource.refresh}/>{action.error instanceof ApiError && action.error.status === 409 && <Link className="button secondary" href={back}>Pilih jadwal lain</Link>}{priceChanged && <div className="message warning" role="status">Harga berubah. Ringkasan telah diperbarui; periksa lagi sebelum konfirmasi.</div>}
    <div className="surface checkout-summary"><div className="court-title"><div><small>{court.sport === 'futsal' ? 'Futsal' : 'Badminton'}</small><h2>{court.name}</h2></div><span className="badge">Website</span></div><dl className="definition-list"><div><dt>Tanggal</dt><dd>{dateLabel(date)}</dd></div><div><dt>Waktu</dt><dd>{hourText(hour)}–{hourText(hour + duration)} WIB</dd></div><div><dt>Durasi</dt><dd>{duration} jam</dd></div><div><dt>Harga per jam</dt><dd>{rupiah(court.hourly_rate)}</dd></div><div className="total-line"><dt>Total sewa</dt><dd>{rupiah(total)}</dd></div><div><dt>Minimal DP ({resource.data!.dp_percent}%)</dt><dd>{rupiah(dp)}</dd></div></dl></div>
    <div className="surface stack"><h2>Setelah reservasi dibuat</h2><ol className="steps"><li>Slot ditahan hingga {resource.data!.hold_minutes} menit, paling lama sampai waktu mulai.</li><li>Unggah bukti pembayaran fiktif sebelum tenggat. DP diterima setelah pegawai menyetujui.</li><li>Pembatalan hanya sebelum mulai. Pembayaran yang diterima tidak dikembalikan dalam simulasi ini.</li></ol><label className="check-field"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}/>Saya sudah memeriksa jadwal dan memahami aturan simulasi.</label><button disabled={!checked || action.busy} onClick={() => action.run(async () => {
      const fresh = await api<Catalog>(`/courts?date=${date}`); const current = fresh.courts.find(c => c.id === courtId);
      if (!current || !availableDurations(current, hour).includes(duration)) throw new ApiError('Slot baru saja diambil. Pilih jadwal lain untuk melanjutkan.', 409);
      if (current.hourly_rate !== court.hourly_rate || fresh.dp_percent !== resource.data!.dp_percent) { setPriceChanged(true); setChecked(false); resource.refresh(); return; }
      const booking = await api<Booking>('/bookings', 'POST', { court_id: courtId, date, hour, duration }); router.push(`/reservasi/${booking.id}?created=1`);
    })}>{action.busy ? 'Mengamankan slot…' : 'Konfirmasi reservasi'}</button><small>Ini simulasi lokal. Tidak ada rekening atau QR pembayaran aktif.</small></div>
  </section>;
}
