import { ReportsPage } from '../../../components/reports';
// Uang dihitung per tanggal kalender diterima (WIB), bukan tanggal operasional jadwal.
export default function Page() { const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); return <ReportsPage today={today}/>; }
