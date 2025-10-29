import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { backendFetch } from '@/lib/backend-fetch';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
import { EmployeeDashboardResponse } from '@/types/dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const data = await backendFetch<EmployeeDashboardResponse>('/employee/dashboard', session);

  return <EmployeeDashboard initialData={data} />;
}
