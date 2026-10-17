export type User = { id: number; name: string; email: string; role: 'customer' | 'staff' | 'owner' };
export type Court = { id: number; name: string; sport: string; hourly_rate: number; open_hour: number; close_hour: number; active: boolean; slots?: { hour: number; available: boolean }[] };
export type Payment = { id: number; amount: number; method: string; status: string; has_proof: boolean; rejection_reason: string | null; reviewed_at: string | null; booking?: Booking };
export type Booking = { id: number; court: Court; customer_name: string; source: string; starts_at: string; ends_at: string; total: number; minimum_dp: number; paid_amount: number; payment_status: string; status: string; expires_at: string | null; reason: string | null; payments: Payment[]; events: { id: number; action: string; created_at: string; metadata: { actor: string; reason?: string } }[] };
export type Catalog = { courts: Court[]; dp_percent: number; hold_minutes: number };
export type Report = { total: number; count: number; daily: { period: string; total: number; count: number }[]; monthly: { period: string; total: number; count: number }[]; transactions: Payment[] };
export const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export const dateTime = (s: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(s));
export const hourText = (h: number) => `${String(h).padStart(2, '0')}.00`;
export const labels: Record<string, string> = { pending: 'Menunggu bukti', review: 'Menunggu verifikasi', confirmed: 'Terkonfirmasi', cancelled: 'Dibatalkan', expired: 'Kedaluwarsa', unpaid: 'Belum dibayar', partial: 'DP diterima', paid: 'Lunas', approved: 'Diterima', rejected: 'Ditolak', customer: 'Pelanggan', staff: 'Pegawai', owner: 'Pemilik', website: 'Website', walkin: 'Walk-in', block: 'Pemeliharaan', cash: 'Tunai', transfer: 'Transfer demo', qris: 'QRIS demo', created: 'Reservasi dibuat', blocked: 'Jadwal diblokir', proof_submitted: 'Bukti diajukan', cash_approved: 'Tunai diterima', payment_approved: 'Pembayaran disetujui', payment_rejected: 'Pembayaran ditolak' };

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function api<T>(path: string, method = 'GET', data?: Record<string, unknown> | FormData): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET') {
    const csrf = await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
    if (!csrf.ok) throw new ApiError('Sesi tidak dapat disiapkan. Coba lagi.', csrf.status);
    const cookie = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='));
    if (cookie) headers['X-XSRF-TOKEN'] = decodeURIComponent(cookie.substring(11));
    if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`/api/v1${path}`, { method, credentials: 'include', headers, cache: 'no-store', body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallback: Record<number, string> = { 401: 'Sesi berakhir. Silakan masuk kembali.', 403: 'Akun ini tidak memiliki akses.', 419: 'Sesi berubah. Silakan coba lagi.', 429: 'Terlalu banyak percobaan. Tunggu sebentar.' };
    throw new ApiError(result.errors ? Object.values(result.errors).flat().join(' ') : fallback[response.status] || result.message || 'Layanan belum tersedia. Coba lagi.', response.status);
  }
  return result as T;
}
