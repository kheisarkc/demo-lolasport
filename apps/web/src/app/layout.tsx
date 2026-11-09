import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { AppShell } from '../components/shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lola Sport | Demo Reservasi Lapangan',
  description: 'Reservasi lapangan futsal dan badminton Lola Sport.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#136348' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><Suspense fallback={<div className="loading-state" role="status">Menyiapkan Lola Sport…</div>}><AppShell>{children}</AppShell></Suspense></body></html>;
}
