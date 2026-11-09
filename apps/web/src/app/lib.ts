export type User = { id: number; name: string; email: string; role: 'staff' | 'owner' };
export type Slot = { hour: number; available: boolean; status: 'available' | 'booked' | 'blocked' | 'past' };
export type Court = { id: number; name: string; sport: string; hourly_rate: number; open_hour: number; close_hour: number; active: boolean; slots?: Slot[] };
export type Payment = { id: number; amount: number; method: string; status: string; has_proof: boolean; rejection_reason: string | null; reviewed_at: string | null; created_at: string; kind?: 'dp' | 'settlement' | 'full'; booking?: Booking };
export type Booking = { id: number; code: string; court: Court; customer_name: string; customer_phone: string | null; source: string; play_date: string; starts_at: string; ends_at: string; total: number; minimum_dp: number; paid_amount: number; payment_status: string; status: string; expires_at: string | null; server_now?: string; reason: string | null; access_token?: string; payments: Payment[]; events: { id: number; action: string; created_at: string; metadata: { actor: string; reason?: string } }[] };
export type Catalog = { courts: Court[]; date: string; today: string; max_days_ahead: number; server_now: string; dp_percent: number; hold_minutes: number };
export type Settings = { courts: Court[]; dp_percent: number; hold_minutes: number };
export type Report = { total: number; count: number; forfeited: number; totals_by_kind: { dp: number; settlement: number; full: number }; totals_by_method: { cash: number; qris: number }; daily: { period: string; total: number; count: number }[]; monthly: { period: string; total: number; count: number }[]; transactions: Payment[] };
export const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export const dateTime = (s: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(s));
/** Jam 24 = 00.00 dan 25 = 01.00 (dini hari, masih tanggal operasional yang sama). */
export const hourText = (h: number) => `${String(h % 24).padStart(2, '0')}.00`;
/** Tanggal operasional: pukul 00.00–00.59 masih milik hari sebelumnya. */
export const operationalToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 3600000));
export const labels: Record<string, string> = { pending: 'Menunggu bukti', review: 'Menunggu verifikasi', confirmed: 'Terkonfirmasi', checked_in: 'Hadir', no_show: 'Tidak datang', cancelled: 'Dibatalkan', expired: 'Kedaluwarsa', unpaid: 'Belum dibayar', partial: 'DP diterima', paid: 'Lunas', approved: 'Diterima', rejected: 'Ditolak', staff: 'Penjaga', owner: 'Pemilik', website: 'Website', walkin: 'Walk-in', block: 'Tutup lapangan', cash: 'Tunai', qris: 'QRIS', created: 'Reservasi dibuat', blocked: 'Jadwal ditutup', proof_submitted: 'Bukti diajukan', cash_approved: 'Tunai diterima', counter_qris_approved: 'QRIS di tempat diterima', payment_approved: 'Pembayaran disetujui', payment_rejected: 'Pembayaran ditolak' };

const TOKENS = 'lola-booking-tokens';
/** Pelanggan tidak punya akun. Token tiap pesanan disimpan di perangkat ini. */
export function bookingTokens(): Record<string, string> { try { return JSON.parse(localStorage.getItem(TOKENS) || '{}'); } catch { return {}; } }
export function saveBookingToken(code: string, token: string) { try { localStorage.setItem(TOKENS, JSON.stringify({ ...bookingTokens(), [code]: token })); } catch { /* penyimpanan diblokir: pesanan tetap bisa dibuka lewat Cek pesanan */ } }
export function proofUrl(payment: Payment, code: string) { const token = bookingTokens()[code]; return `/api/v1/payments/${payment.id}/proof${token ? `?token=${token}` : ''}`; }

export class ApiError extends Error { constructor(message: string, public status: number, public fields: Record<string, string[]> = {}) { super(message); } }
const xsrfCookie = () => document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.substring(11);
/** Token CSRF dipakai ulang; diminta ke server hanya bila belum ada (hemat satu bolak-balik per aksi). */
async function ensureCsrf(force = false) {
  if (!force && xsrfCookie()) return;
  const csrf = await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
  if (!csrf.ok) throw new ApiError('Sesi tidak dapat disiapkan. Coba lagi.', csrf.status);
}
export async function api<T>(path: string, method = 'GET', data?: Record<string, unknown> | FormData): Promise<T> {
  const code = path.match(/^\/bookings\/(LS-[A-Z0-9]+)/)?.[1];
  const token = code ? bookingTokens()[code] : undefined;
  async function send() {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['X-Booking-Token'] = token;
    if (method !== 'GET') {
      const cookie = xsrfCookie();
      if (cookie) headers['X-XSRF-TOKEN'] = decodeURIComponent(cookie);
      if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json';
    }
    return fetch(`/api/v1${path}`, { method, credentials: 'include', headers, cache: 'no-store', body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined });
  }
  if (method !== 'GET') await ensureCsrf();
  let response = await send();
  if (response.status === 419 && method !== 'GET') { await ensureCsrf(true); response = await send(); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallback: Record<number, string> = { 401: 'Sesi berakhir. Silakan masuk kembali.', 403: 'Akun ini tidak memiliki akses.', 404: 'Data tidak ditemukan atau sudah tidak tersedia.', 419: 'Sesi berubah. Silakan coba lagi.', 429: 'Terlalu banyak percobaan. Tunggu sebentar.', 500: 'Layanan belum merespons dengan benar. Coba lagi.' };
    throw new ApiError(result.errors ? Object.values(result.errors).flat().join(' ') : result.message || fallback[response.status] || 'Layanan belum tersedia. Coba lagi.', response.status, result.errors || {});
  }
  return result as T;
}
