'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, Booking, dateTime, labels, Payment, proofUrl, rupiah } from '../app/lib';
import { Badge, Choice, Dialog, Failure, Field, Loading, useAction } from './common';

export function ProofPreview({ payment, code, expanded = false }: { payment: Payment; code: string; expanded?: boolean }) {
  const [visible, setVisible] = useState(expanded); const [zoom, setZoom] = useState(false);
  const [state, setState] = useState<{ url?: string; type?: string; error?: Error }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!visible || !payment.has_proof) return;
    let active = true; let objectUrl: string | undefined;
    fetch(proofUrl(payment, code), { credentials: 'include', cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new ApiError('Bukti tidak dapat dibuka dengan sesi ini.', response.status);
      return response.blob();
    }).then(blob => { objectUrl = URL.createObjectURL(blob); if (active) setState({ url: objectUrl, type: blob.type }); }).catch(error => { if (active) setState({ error }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [visible, payment, code, attempt]);
  if (!payment.has_proof) return null;
  const content = state.url ? state.type?.includes('pdf') ? <iframe title={`Bukti PDF pembayaran #${payment.id}`} src={state.url} className="proof-pdf"/> : <img className="proof-image" src={state.url} alt={`Bukti pembayaran #${payment.id}`}/> : state.error ? <Failure error={state.error} retry={() => setAttempt(v => v + 1)}/> : <Loading text="Membuka bukti…"/>;
  return <div className="proof-view">{!visible ? <button className="secondary" onClick={() => setVisible(true)}>Lihat bukti</button> : <><div className="proof-frame" onClick={() => state.url && setZoom(true)}>{content}</div>{state.url && <button className="secondary" onClick={() => setZoom(true)}>Perbesar bukti</button>}</>}{zoom && <Dialog title={`Bukti pembayaran #${payment.id}`} close={() => setZoom(false)}>{content}</Dialog>}</div>;
}

/** Gambar QRIS ilustrasi (bukan kode pembayaran yang bisa dipindai). */
function QrisMark() {
  const size = 21; const cells: [number, number][] = [];
  const finder = (x: number, y: number) => x < 7 && y < 7 || x > 13 && y < 7 || x < 7 && y > 13;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!finder(x, y) && (x * 7 + y * 13 + x * y) % 5 < 2) cells.push([x, y]);
  const box = (x: number, y: number) => <g key={`${x}-${y}`}><rect x={x} y={y} width="7" height="7" fill="currentColor"/><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff"/><rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor"/></g>;
  return <svg className="qris-mark" viewBox="-1 -1 23 23" role="img" aria-label="QRIS Lola Sport"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/>{box(0, 0)}{box(14, 0)}{box(0, 14)}{cells.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width="1" height="1" fill="currentColor"/>)}</svg>;
}

export function PaymentForm({ booking, staff, onDone }: { booking: Booking; staff: boolean; onDone: (message: string) => void }) {
  const remaining = booking.total - booking.paid_amount; const first = booking.paid_amount === 0; const canChoose = first && booking.minimum_dp < remaining;
  const [plan, setPlan] = useState<'dp' | 'full'>('dp'); const [method, setMethod] = useState<'cash' | 'qris'>(staff ? 'cash' : 'qris');
  const [preview, setPreview] = useState(''); const [fileName, setFileName] = useState(''); const [fileError, setFileError] = useState('');
  const currentUrl = useRef(''); const action = useAction();
  useEffect(() => () => { if (currentUrl.current) URL.revokeObjectURL(currentUrl.current); }, []);
  const amount = canChoose && plan === 'dp' ? booking.minimum_dp : remaining;
  return <section className="surface stack payment-form"><h2>{staff ? 'Terima pembayaran' : first ? 'Bayar reservasi' : 'Lunasi sisa tagihan'}</h2>
    {canChoose ? <Choice label="Jumlah bayar" value={plan} onChange={setPlan} options={[['dp', <><span>DP</span><strong>{rupiah(booking.minimum_dp)}</strong></>], ['full', <><span>Lunas</span><strong>{rupiah(remaining)}</strong></>]]}/> : <div className="amount-fixed"><span>{first ? 'Bayar penuh' : 'Sisa tagihan'}</span><strong>{rupiah(amount)}</strong></div>}
    {staff && <Choice label="Cara bayar" value={method} onChange={setMethod} options={[['cash', 'Tunai'], ['qris', 'QRIS di tempat']]}/>}
    {!staff && <div className="qris-box"><QrisMark/><div><strong>Scan QRIS Lola Sport</strong><span>Transfer tepat <b>{rupiah(amount)}</b>, lalu unggah bukti transfernya di bawah.</span></div></div>}
    <Failure error={action.error}/>
    <form className="stack" onSubmit={e => { e.preventDefault(); if (fileError) return; const data = new FormData(e.currentTarget); data.set('method', method); data.set('amount', String(amount)); void action.run(async () => { await api(`/bookings/${booking.code}/payments`, 'POST', data); onDone(staff ? `Pembayaran ${labels[method].toLowerCase()} diterima dan tercatat.` : 'Bukti terkirim. Pembayaran menunggu pemeriksaan pegawai.'); }); }}>
      {!staff && <><Field label="Bukti pembayaran" name="proof" error={action.error} hint="Foto atau tangkapan layar transfer (JPG, PNG, atau PDF, maks. 2 MB)."><input className="file-input" name="proof" type="file" accept="image/png,image/jpeg,application/pdf" required onChange={e => {
        const file = e.target.files?.[0]; if (currentUrl.current) URL.revokeObjectURL(currentUrl.current); setPreview(''); setFileName(file?.name || ''); setFileError('');
        if (!file) return;
        if (file.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) { setFileError('Pilih PNG, JPG atau PDF berukuran maksimal 2 MB.'); return; }
        if (file.type.startsWith('image/')) { currentUrl.current = URL.createObjectURL(file); setPreview(currentUrl.current); }
      }}/></Field>{fileError && <p role="alert" className="field-error">{fileError}</p>}{preview && <img className="upload-preview" src={preview} alt="Pratinjau bukti yang akan dikirim"/>}{fileName && !preview && <small className="file-name">File dipilih: {fileName}</small>}<a className="text-link sample-link" href="/bukti-demo.png" download>Belum punya file? Unduh contoh bukti</a></>}
      <button disabled={action.busy || !!fileError}>{action.busy ? 'Menyimpan…' : staff ? `Catat ${rupiah(amount)} diterima` : 'Kirim bukti pembayaran'}</button>
    </form></section>;
}

export function ReviewPayment({ payment, booking, onDone }: { payment: Payment; booking: Booking; onDone: (message: string) => void }) {
  const [rejecting, setRejecting] = useState(false); const action = useAction();
  const decide = (decision: 'approved' | 'rejected', reason: string | null = null) => action.run(async () => { await api(`/payments/${payment.id}/review`, 'POST', { decision, reason }); setRejecting(false); onDone(decision === 'approved' ? 'Pembayaran disetujui dan tercatat.' : 'Bukti ditolak dengan alasan.'); });
  return <section className="surface stack review-payment"><div className="section-title"><h2>{booking.customer_name}</h2><Badge value={payment.status}>{payment.status === 'pending' ? 'Perlu verifikasi' : labels[payment.status]}</Badge></div><p>{booking.code} · {booking.court.name} · {dateTime(booking.starts_at)} WIB<br/>{labels[payment.method]} · dikirim {dateTime(payment.created_at)} WIB</p><div className="money-comparison"><div><span>Nominal di bukti</span><strong>{rupiah(payment.amount)}</strong></div><div><span>Sudah diterima</span><strong>{rupiah(booking.paid_amount)}</strong></div><div><span>Sisa tagihan</span><strong>{rupiah(booking.total - booking.paid_amount)}</strong></div></div><ProofPreview payment={payment} code={booking.code} expanded/><Failure error={action.error}/>
    {payment.status === 'pending' && <div className="review-buttons"><button className="danger" disabled={action.busy} onClick={() => setRejecting(true)}>Tolak bukti</button><button disabled={action.busy} onClick={() => decide('approved')}>{action.busy ? 'Menyimpan…' : 'Setujui pembayaran'}</button></div>}
    {rejecting && <Dialog title="Tolak bukti pembayaran?" close={() => setRejecting(false)} busy={action.busy}><p>{booking.paid_amount ? 'Reservasi tetap terkonfirmasi. Pelanggan bisa mengirim bukti pelunasan lagi.' : 'Ini bukti DP pertama: reservasi dibatalkan dan jamnya dibuka lagi.'}</p><Failure error={action.error}/><form className="stack" onSubmit={e => { e.preventDefault(); void decide('rejected', String(new FormData(e.currentTarget).get('reason') || '')); }}>
      <Field label="Alasan penolakan" name="reason" error={action.error}><textarea name="reason" minLength={3} maxLength={200} required autoFocus placeholder="Contoh: nominal tidak masuk di mutasi"/></Field>
      <div className="actions"><button className="secondary" type="button" disabled={action.busy} onClick={() => setRejecting(false)}>Kembali</button><button className="danger filled" disabled={action.busy}>{action.busy ? 'Menyimpan…' : 'Tolak dengan alasan'}</button></div>
    </form></Dialog>}</section>;
}
