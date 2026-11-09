import { operationalToday } from '../lib';
import { StaffHomePage } from '../../components/staff';
export default function Page() { const today = operationalToday(); return <StaffHomePage today={today}/>; }
