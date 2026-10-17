import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lola Sport | Demo Reservasi Lapangan',
  description: 'Demo lokal reservasi futsal dan badminton. Data dan pembayaran simulasi.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
