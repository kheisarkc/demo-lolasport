'use client';

import Link from 'next/link';
import { Catalog, Court, hourText, rupiah, Slot } from '../app/lib';
import { DateStrip, dateLabel, Empty, Failure, Heading, Icon, Loading, useQuery, useResource, useToday } from './common';
import { RoleHome } from './shell';

export const slotLabels: Record<Slot['status'], string> = { available: 'Tersedia', booked: 'Terisi', blocked: 'Ditutup', past: 'Lewat' };
export function availableDurations(court: Court, hour: number) {
  return Array.from({ length: Math.max(0, Math.min(18, court.close_hour - hour)) }, (_, i) => i + 1).filter(duration => Array.from({ length: duration }, (_, i) => hour + i).every(h => court.slots?.some(slot => slot.hour === h && slot.available)));
}
export function CatalogPage() { const today = useToday(); return <RoleHome>{today ? <CatalogContent today={today}/> : <Loading/>}</RoleHome>; }
function CatalogContent({ today }: { today: string }) {
  const { params, update } = useQuery();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date')! : today;
  const resource = useResource<Catalog>(`/courts?date=${date}`);
  const courts = resource.data?.courts || [];
  const court = courts.find(c => c.id === Number(params.get('court'))) || courts[0];
  const hour = params.has('hour') ? Number(params.get('hour')) : -1; const duration = Math.max(1, Number(params.get('duration') || 1));
  const valid = !!court && hour >= 0 && availableDurations(court, hour).includes(duration);
  const slots = court?.slots?.filter(slot => slot.status !== 'past') || [];
  /** Ketuk jam mulai; ketuk jam lain sesudahnya untuk memperpanjang sampai jam itu. */
  function pick(slot: Slot) {
    if (!court) return;
    const end = slot.hour - hour + 1;
    if (valid && slot.hour > hour && availableDurations(court, hour).includes(end)) update({ court: court.id, hour, duration: end });
    else if (valid && slot.hour === hour && duration === 1) update({ hour: null, duration: null });
    else update({ court: court.id, hour: slot.hour, duration: 1 });
  }
  const checkout = court ? `/checkout?${new URLSearchParams({ date, court: String(court.id), hour: String(hour), duration: String(duration) })}` : '/';
  return <div className={valid ? 'with-selection' : ''}>
    <Heading title="Cari waktu mainmu" text="Buka 07.00–01.00 WIB. Pesan tanpa akun."/>
    <DateStrip date={date} today={today} maxDays={resource.data?.max_days_ahead} onChange={value => update({ date: value, hour: null, duration: null })}/>
    <Failure error={resource.error} retry={resource.refresh}/>
    {resource.loading ? <Loading text="Memuat jadwal lapangan…"/> : resource.data && (!court ? <Empty title="Belum ada lapangan aktif"/> : <>
      <div className="court-tabs" role="tablist" aria-label="Pilih lapangan">{courts.map(c => <button key={c.id} role="tab" aria-selected={c.id === court.id} className={c.id === court.id ? 'selected' : 'secondary'} onClick={() => update({ court: c.id, hour: null, duration: null })}><strong>{c.name}</strong><small>{rupiah(c.hourly_rate)}/jam</small></button>)}</div>
      <section className="court-panel" aria-label={court.name}>
        <div className="court-panel-heading"><h2>{court.name}</h2><span>{court.sport === 'futsal' ? 'Futsal' : 'Badminton'} · {rupiah(court.hourly_rate)} / jam</span></div>
        {!slots.length ? <Empty title="Jadwal tanggal ini sudah lewat"><p>Pilih tanggal lain.</p></Empty> : <div className="slot-grid">{slots.map(slot => {
          const chosen = valid && slot.hour >= hour && slot.hour < hour + duration;
          return <button key={slot.hour} disabled={!slot.available} aria-pressed={chosen} className={`slot slot-${slot.status}${chosen ? ' chosen' : ''}`} aria-label={`${court.name} ${hourText(slot.hour)} ${chosen ? 'Dipilih' : slotLabels[slot.status]}`} onClick={() => pick(slot)}><strong>{hourText(slot.hour)}–{hourText(slot.hour + 1)}</strong><small>{chosen ? '✓' : slotLabels[slot.status]}</small></button>;
        })}</div>}
        <p className="slot-hint">{valid ? 'Mau main lebih lama? Ketuk jam terakhir main.' : 'Ketuk jam mulai main. Jam 00.00 masih masuk tanggal yang dipilih.'}</p>
      </section>
      {params.has('hour') && !valid && <div className="message warning" role="status"><strong>Jam itu sudah tidak tersedia</strong><p>Pilih jam lain di atas.</p></div>}
    </>)}
    {court && valid && <aside className="selection-bar" aria-label="Ringkasan pilihan"><div className="selection-description"><strong>{hourText(hour)}–{hourText(hour + duration)} · {duration} jam</strong><span>{court.name} · {dateLabel(date)}</span></div><div className="selection-total"><small>Total</small><strong>{rupiah(court.hourly_rate * duration)}</strong></div><Link className="button" href={checkout}>Lanjutkan<Icon name="arrow"/></Link></aside>}
  </div>;
}
