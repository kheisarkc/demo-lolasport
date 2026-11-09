import { CatalogPage } from '../components/catalog';
import { operationalToday } from './lib';

export const dynamic = 'force-dynamic';

export default function Page() {
  const today = operationalToday();
  return <CatalogPage today={today} />;
}
