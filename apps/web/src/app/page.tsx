import DemoApp from './ui';

export const dynamic = 'force-dynamic';

export default function Page() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return <DemoApp today={today} />;
}
