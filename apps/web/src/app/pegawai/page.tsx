import { StaffHomePage } from '../../components/staff';
export default function Page() { const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); return <StaffHomePage today={today}/>; }
