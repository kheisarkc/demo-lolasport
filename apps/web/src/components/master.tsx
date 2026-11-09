'use client';

import { useState } from 'react';
import { api, Court, hourText, rupiah, Settings } from '../app/lib';
import { Badge, Dialog, Empty, Failure, Field, Heading, Icon, Loading, useAction, useQuery, useResource } from './common';
import { Guard } from './shell';

/** Pemilik mengatur harga lapangan, DP, dan batas bayar. Penjaga tidak bisa mengubahnya. */
export function OwnerSettingsPage() { return <Guard roles={['owner']}><SettingsContent/></Guard>; }
function SettingsContent() {
  const resource = useResource<Settings>('/owner/settings'); const { params, update } = useQuery(); const [message, setMessage] = useState(''); const edit = params.get('edit');
  const court = resource.data?.courts.find(c => String(c.id) === edit);
  return <section><Heading title="Pengaturan" text="Harga dan aturan baru berlaku untuk pesanan berikutnya." action={<button onClick={() => update({ edit: 'new' }, true)}>+ Tambah lapangan</button>}/>{message && <div className="message success" role="status">{message}</div>}<Failure error={resource.error} retry={resource.refresh}/>
    {resource.loading ? <Loading/> : resource.data && <><RulesForm key={`${resource.data.dp_percent}-${resource.data.hold_minutes}`} settings={resource.data} done={() => { resource.refresh(); setMessage('Aturan pemesanan disimpan.'); }}/>
    <div className="section-title"><h2>Lapangan dan harga</h2><span>{resource.data.courts.length} lapangan</span></div>
    {!resource.data.courts.length ? <Empty title="Belum ada lapangan"><p>Tambahkan lapangan untuk mulai menyusun jadwal.</p></Empty> : <div className="master-list">{resource.data.courts.map(c => <article className="master-item" key={c.id}><span className={`sport-icon ${c.sport}`}><Icon name="court"/></span><div className="master-info"><h2>{c.name}</h2><p>{c.sport === 'futsal' ? 'Futsal' : 'Badminton'} · {hourText(c.open_hour)}–{hourText(c.close_hour)}</p><strong>{rupiah(c.hourly_rate)} / jam</strong></div><Badge value={c.active ? 'confirmed' : 'cancelled'}>{c.active ? 'Aktif' : 'Nonaktif'}</Badge><button className="secondary" aria-label={`Edit ${c.name}`} onClick={() => update({ edit: c.id }, true)}>Edit</button></article>)}</div>}</>}
    <p className="fine-print">Jam buka semua lapangan 07.00–01.00. Lapangan yang masih punya pesanan aktif tidak bisa dinonaktifkan.</p>
    {(edit === 'new' || court) && <CourtEditor key={edit} court={court} close={() => update({ edit: null })} done={() => { update({ edit: null }); resource.refresh(); setMessage('Data lapangan disimpan. Harga pesanan lama tetap.'); }}/>}</section>;
}
function RulesForm({ settings, done }: { settings: Settings; done: () => void }) {
  const action = useAction();
  return <form className="surface stack" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); action.run(async () => { await api('/owner/settings', 'PUT', { dp_percent: Number(form.get('dp_percent')), hold_minutes: Number(form.get('hold_minutes')) }); done(); }); }}>
    <h2>Aturan pemesanan</h2><Failure error={action.error}/>
    <div className="two-fields"><Field label="DP minimal (%)" name="dp_percent" error={action.error}><input name="dp_percent" type="number" inputMode="numeric" min={1} max={100} defaultValue={settings.dp_percent} required/></Field><Field label="Batas bayar (menit)" name="hold_minutes" error={action.error}><input name="hold_minutes" type="number" inputMode="numeric" min={5} max={120} defaultValue={settings.hold_minutes} required/></Field></div>
    
    <button disabled={action.busy}>{action.busy ? 'Menyimpan…' : 'Simpan aturan'}</button></form>;
}
function CourtEditor({ court, close, done }: { court?: Court; close: () => void; done: () => void }) {
  const action = useAction();
  return <Dialog title={court ? `Edit ${court.name}` : 'Tambah lapangan'} close={close} busy={action.busy}><Failure error={action.error}/><form className="stack" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); const data = { name: form.get('name'), sport: form.get('sport'), hourly_rate: Number(form.get('hourly_rate')), active: form.get('active') === 'true' }; action.run(async () => { await api(court ? `/owner/courts/${court.id}` : '/owner/courts', court ? 'PATCH' : 'POST', data); done(); }); }}>
    <Field label="Nama lapangan" name="name" error={action.error}><input name="name" defaultValue={court?.name} maxLength={80} required autoFocus/></Field><Field label="Olahraga" name="sport" error={action.error}><select name="sport" defaultValue={court?.sport || 'badminton'}><option value="badminton">Badminton</option><option value="futsal">Futsal</option></select></Field><Field label="Harga per jam (rupiah)" name="hourly_rate" error={action.error}><input name="hourly_rate" type="number" inputMode="numeric" min={1000} max={10000000} step={1} defaultValue={court?.hourly_rate || 35000} required/></Field><Field label="Status lapangan" name="active" error={action.error}><select name="active" defaultValue={court?.active === false ? 'false' : 'true'}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></Field><p className="fine-print">Perubahan hanya berlaku untuk pesanan berikutnya.</p><div className="actions"><button className="secondary" type="button" disabled={action.busy} onClick={close}>Batal</button><button disabled={action.busy}>{action.busy ? 'Menyimpan…' : court ? 'Simpan perubahan' : 'Tambah lapangan'}</button></div></form></Dialog>;
}
