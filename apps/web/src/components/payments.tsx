'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, Booking, dateTime, labels, Payment, rupiah } from '../app/lib';
import { Badge, Dialog, Failure, Field, Loading, useAction } from './common';

export function ProofPreview({ payment, expanded = false }: { payment: Payment; expanded?: boolean }) {
  const [visible, setVisible] = useState(expanded); const [zoom, setZoom] = useState(false);
  const [state, setState] = useState<{ url?: string; type?: string; error?: Error }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!visible || !payment.has_proof) return;
    let active = true; let objectUrl: string | undefined;
    fetch(`/api/v1/payments/${payment.id}/proof`, { credentials: 'include', cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new ApiError('Bukti tidak dapat dibuka dengan sesi ini.', response.status);
      return response.blob();
    }).then(blob => { objectUrl = URL.createObjectURL(blob); if (active) setState({ url: objectUrl, type: blob.type }); }).catch(error => { if (active) setState({ error }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [visible, payment.id, payment.has_proof, attempt]);
  if (!payment.has_proof) return <p className="muted">Tunai dicatat oleh pegawai. Tidak ada lampiran.</p>;
  const content = state.url ? state.type?.includes('pdf') ? <iframe title={`Bukti PDF pembayaran #${payment.id}`} src={state.url} className="proof-pdf"/> : <img className="proof-image" src={state.url} alt={`Bukti pembayaran fiktif #${payment.id}`}/> : state.error ? <Failure error={state.error} retry={() => setAttempt(v => v + 1)}/> : <Loading text="Membuka bukti privat…"/>;
  return <div className="proof-view">{!visible ? <button className="secondary" onClick={() => setVisible(true)}>Lihat bukti #{payment.id}</button> : <><div className="proof-frame">{content}</div>{state.url && <button className="secondary" onClick={() => setZoom(true)}>Perbesar bukti #{payment.id}</button>}</>}<a className="text-link" href={`/api/v1/payments/${payment.id}/proof`}>Unduh bukti #{payment.id}</a>{zoom && <Dialog title={`Bukti pembayaran #${payment.id}`} close={() => setZoom(false)}>{content}<p className="fine-print">Bukti privat. Periksa nominal dan identitas simulasi sebelum memutuskan.</p></Dialog>}</div>;
}

export function PaymentForm({ booking, staff, onDone }: { booking: Booking; staff: boolean; onDone: (message: string) => void }) {
  const [method, setMethod] = useState('transfer'); const [preview, setPreview] = useState(''); const [fileName, setFileName] = useState(''); const [fileError, setFileError] = useState(''); const [cash, setCash] = useState<FormData | null>(null);
  const currentUrl = useRef(''); const action = useAction(); const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => () => { if (currentUrl.current) URL.revokeObjectURL(currentUrl.current); }, []);
  const remaining = booking.total - booking.paid_amount;
  async function submit(data: FormData) {
    await action.run(async () => { await api(`/bookings/${booking.id}/payments`, 'POST', data); setCash(null); onDone(method === 'cash' ? 'Pembayaran tunai diterima dan tercatat.' : 'Bukti terkirim. Pembayaran menunggu pemeriksaan pegawai.'); });
  }
  return <section className="surface stack"><div><h2>{booking.paid_amount ? 'Lunasi sisa tagihan' : 'Kirim bukti pembayaran'}</h2><p>{booking.paid_amount ? `Sisa yang perlu dibayar ${rupiah(remaining)}.` : `Mulai dari DP ${rupiah(booking.minimum_dp)} atau bayar penuh.`}</p></div><div className="demo-note"><strong>Pembayaran simulasi</strong><p>Tidak ada rekening atau QR aktif. Gunakan file fiktif.</p><a href="/bukti-demo.png" download>Unduh bukti fiktif siap unggah (PNG)</a></div><Failure error={action.error}/><form ref={formRef} className="stack" onSubmit={e => { e.preventDefault(); if (fileError) return; const data = new FormData(e.currentTarget); if (method === 'cash') setCash(data); else void submit(data); }}>
    <Field label="Metode" name="method" error={action.error}><select name="method" value={method} onChange={e => setMethod(e.target.value)}><option value="transfer">Transfer demo</option><option value="qris">QRIS demo</option>{staff && <option value="cash">Tunai</option>}</select></Field>
    <Field label="Nominal (rupiah)" name="amount" error={action.error} hint={booking.paid_amount ? 'Pelunasan harus tepat sisa tagihan.' : 'Bukti belum dihitung sebagai pembayaran diterima.'}><input name="amount" type="number" inputMode="numeric" min={booking.paid_amount ? remaining : booking.minimum_dp} max={remaining} step={1} defaultValue={booking.paid_amount ? remaining : booking.minimum_dp} required/></Field>
    {method !== 'cash' && <><Field label="Bukti fiktif" name="proof" error={action.error} hint="PNG, JPG atau PDF. Maksimal 2 MB. Hanya pemilik reservasi dan pegawai yang dapat mengakses."><input name="proof" type="file" accept="image/png,image/jpeg,application/pdf" required onChange={e => {
      const file = e.target.files?.[0]; if (currentUrl.current) URL.revokeObjectURL(currentUrl.current); setPreview(''); setFileName(file?.name || ''); setFileError('');
      if (!file) return;
      if (file.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) { setFileError('Pilih PNG, JPG atau PDF berukuran maksimal 2 MB.'); return; }
      if (file.type.startsWith('image/')) { currentUrl.current = URL.createObjectURL(file); setPreview(currentUrl.current); }
    }}/></Field>{fileError && <p role="alert" className="field-error">{fileError}</p>}{preview && <img className="upload-preview" src={preview} alt="Pratinjau bukti yang akan dikirim"/>}{fileName && <small className="file-name">File dipilih: {fileName}</small>}</>}
    <button disabled={action.busy || !!fileError}>{action.busy ? 'Mengirim pembayaran…' : method === 'cash' ? 'Periksa pencatatan tunai' : 'Kirim bukti pembayaran'}</button>
    </form>{cash && <Dialog title="Catat tunai diterima?" close={() => setCash(null)} busy={action.busy}><dl className="definition-list"><div><dt>Nominal tunai</dt><dd>{rupiah(Number(cash.get('amount')))}</dd></div><div><dt>Sisa setelah diterima</dt><dd>{rupiah(remaining - Number(cash.get('amount')))}</dd></div></dl><p>Tindakan ini langsung menambah penerimaan dan tercatat atas akun pegawai.</p><Failure error={action.error}/><div className="actions"><button className="secondary" disabled={action.busy} onClick={() => setCash(null)}>Periksa lagi</button><button disabled={action.busy} onClick={() => submit(cash)}>{action.busy ? 'Menyimpan…' : 'Catat tunai diterima'}</button></div></Dialog>}</section>;
}

export function ReviewPayment({ payment, booking, onDone }: { payment: Payment; booking: Booking; onDone: (message: string) => void }) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null); const action = useAction();
  return <section className="surface stack review-payment"><div className="section-title"><h2>Pengajuan #{payment.id}</h2><Badge value={payment.status}>{payment.status === 'pending' ? 'Perlu verifikasi' : labels[payment.status]}</Badge></div><div><strong>{booking.court.name} · {booking.customer_name}</strong><p>{dateTime(booking.starts_at)} WIB</p><p>{labels[payment.method]} · Diajukan {dateTime(payment.created_at)} WIB</p></div><div className="money-comparison"><div><span>Nominal diajukan</span><strong>{rupiah(payment.amount)}</strong></div><div><span>Pembayaran diterima</span><strong>{rupiah(booking.paid_amount)}</strong></div><div><span>Sisa tagihan saat ini</span><strong>{rupiah(booking.total - booking.paid_amount)}</strong></div></div><ProofPreview payment={payment} expanded/>{payment.status === 'pending' && <div className="review-buttons"><button className="danger" onClick={() => setDecision('rejected')}>Tolak bukti</button><button onClick={() => setDecision('approved')}>Setujui pembayaran</button></div>}{decision && <Dialog title={decision === 'approved' ? 'Setujui pembayaran ini?' : 'Tolak bukti pembayaran?'} close={() => setDecision(null)} busy={action.busy}><p>{decision === 'approved' ? `${rupiah(payment.amount)} akan masuk penerimaan. Pastikan bukti simulasi sudah diperiksa.` : booking.paid_amount ? 'Reservasi tetap terkonfirmasi. Pelanggan dapat mengirim bukti pelunasan kembali.' : 'Penolakan bukti awal membatalkan reservasi dan melepas slot.'}</p><Failure error={action.error}/><form className="stack" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); action.run(async () => { await api(`/payments/${payment.id}/review`, 'POST', { decision, reason: form.get('reason') || null }); setDecision(null); onDone(decision === 'approved' ? 'Pembayaran disetujui dan tercatat.' : 'Bukti ditolak dengan alasan.'); }); }}>
      {decision === 'rejected' && <Field label="Alasan penolakan" name="reason" error={action.error}><textarea name="reason" minLength={3} maxLength={200} required autoFocus placeholder="Jelaskan bagian bukti yang perlu diperbaiki"/></Field>}
      <div className="actions"><button className="secondary" type="button" disabled={action.busy} onClick={() => setDecision(null)}>Kembali</button><button className={decision === 'rejected' ? 'danger filled' : ''} disabled={action.busy}>{action.busy ? 'Menyimpan keputusan…' : decision === 'approved' ? 'Ya, setujui pembayaran' : 'Tolak dengan alasan'}</button></div>
    </form></Dialog>}</section>;
}
