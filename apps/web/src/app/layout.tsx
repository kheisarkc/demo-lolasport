import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { AppShell } from '../components/shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lola Sport | Demo Reservasi Lapangan',
  description: 'Demo lokal reservasi futsal dan badminton. Data dan pembayaran simulasi.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#136348' };
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><Suspense fallback={<div className="loading-state" role="status">Menyiapkan Lola Sport…</div>}><AppShell>{children}</AppShell></Suspense></body></html>;
}
