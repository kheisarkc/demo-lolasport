'use client';

import Link from 'next/link';
import { Catalog, Court, hourText, rupiah, Slot } from '../app/lib';
import { DateStrip, dateLabel, Empty, Failure, Heading, Icon, Loading, useQuery, useResource } from './common';
import { RoleHome, useAuth } from './shell';

export const slotLabels: Record<Slot['status'], string> = { available: 'Tersedia', booked: 'Terisi', blocked: 'Diblokir', past: 'Lewat' };
export function availableDurations(court: Court, hour: number) {
  return Array.from({ length: Math.max(0, Math.min(14, court.close_hour - hour)) }, (_, i) => i + 1).filter(duration => Array.from({ length: duration }, (_, i) => hour + i).every(h => court.slots?.some(slot => slot.hour === h && slot.available)));
}
export function CatalogPage({ today }: { today: string }) { return <RoleHome><CatalogContent today={today}/></RoleHome>; }
function CatalogContent({ today }: { today: string }) {
  const { params, update } = useQuery(); const { user } = useAuth();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date')! : today;
  const sport = params.get('sport') || 'all'; const hour = Number(params.get('hour') ?? -1); const duration = Number(params.get('duration') || 1);
  const resource = useResource<Catalog>(`/courts?date=${date}`);
  const court = resource.data?.courts.find(c => c.id === Number(params.get('court')));
  const valid = !!court?.slots?.some(s => s.hour === hour && s.available) && !!court && availableDurations(court, hour).includes(duration);
  const visible = resource.data?.courts.filter(c => sport === 'all' || c.sport === sport) || [];
  const checkout = `/checkout?${new URLSearchParams({ date, court: String(court?.id), hour: String(hour), duration: String(duration) })}`;
  return <div className={valid ? 'with-selection' : ''}>
    <Heading title="Cari waktu mainmu" text="Pilih lapangan dan jam. Semua waktu dalam WIB." action={<button className="icon-button secondary" aria-label="Muat ulang jadwal" onClick={resource.refresh}>↻</button>}/>
    <div className="sport-filter" aria-label="Jenis olahraga">{[['all', 'Semua'], ['futsal', 'Futsal'], ['badminton', 'Badminton']].map(([key, label]) => <button key={key} aria-pressed={sport === key} className={sport === key ? 'selected' : 'secondary'} onClick={() => update({ sport: key, court: null, hour: null, duration: null })}><Icon name="court"/>{label}</button>)}</div>
    <DateStrip date={date} today={today} onChange={value => update({ date: value, court: null, hour: null, duration: null })}/>
    <Failure error={resource.error} retry={resource.refresh}/>
    {resource.loading ? <Loading text="Memuat jadwal lapangan…"/> : resource.data && <>
      <div className="section-title"><h2>Lapangan tersedia</h2><span>{visible.length} lapangan</span></div>
      {!visible.length && <Empty title="Belum ada lapangan untuk pilihan ini"><p>Ganti jenis olahraga atau tanggal.</p><button className="secondary" onClick={() => update({ sport: 'all' })}>Lihat semua olahraga</button></Empty>}
      <div className="court-list">{visible.map(item => <article className="court-card" key={item.id}><div className={`court-ribbon ${item.sport}`} aria-hidden="true"><span/><Icon name="court"/></div><div className="court-content"><div className="court-title"><div><small>{item.sport === 'futsal' ? 'Futsal' : 'Badminton'}</small><h3>{item.name}</h3><span>{hourText(item.open_hour)}–{hourText(item.close_hour)} WIB</span></div><p className="court-price">{rupiah(item.hourly_rate)}<small>/ jam</small></p></div><div className="slot-grid">{item.slots?.map(slot => {
        const chosen = item.id === court?.id && hour === slot.hour && valid;
        return <button key={slot.hour} disabled={!slot.available} aria-pressed={chosen} className={`slot slot-${slot.status}${chosen ? ' chosen' : ''}`} aria-label={`${item.name} ${hourText(slot.hour)} ${chosen ? 'Dipilih' : slotLabels[slot.status]}`} onClick={() => update({ court: item.id, hour: slot.hour, duration: 1 })}><strong>{hourText(slot.hour)}</strong><span>{rupiah(item.hourly_rate).replace(/\s/g, ' ')}</span><small>{chosen ? '✓ Dipilih' : slot.status === 'available' ? '+ Tersedia' : slot.status === 'blocked' ? '⊘ Diblokir' : slotLabels[slot.status]}</small></button>;
      })}</div></div></article>)}</div>
      <p className="fine-print">Harga dan kebijakan khusus simulasi. Slot ditahan setelah reservasi dibuat, bukan saat dipilih.</p>
    </>}
    {court && !valid && !resource.loading && <div className="message warning" role="status"><strong>Pilihan perlu diperbarui</strong><p>Slot sudah terisi, lewat, atau durasi tidak tersedia. Pilih jam lain di atas.</p></div>}
    {court && valid && <aside className="selection-bar" aria-label="Ringkasan pilihan"><div className="selection-description"><strong>{court.name}</strong><span>{dateLabel(date)} · {hourText(hour)}–{hourText(hour + duration)}</span></div><label className="duration-control">Durasi<select aria-label="Durasi" value={duration} onChange={e => update({ duration: e.target.value })}>{availableDurations(court, hour).map(d => <option key={d} value={d}>{d} jam</option>)}</select></label><div className="selection-total"><small>Total sewa</small><strong>{rupiah(court.hourly_rate * duration)}</strong></div><Link className="button" href={user ? checkout : `/masuk?next=${encodeURIComponent(checkout)}`}>Lanjutkan<Icon name="arrow"/></Link></aside>}
  </div>;
}
