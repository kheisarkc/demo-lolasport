import { operationalToday } from '../../lib';
import { StaffSchedulePage } from '../../../components/staff';
export default function Page() { const today = operationalToday(); return <StaffSchedulePage today={today}/>; }
