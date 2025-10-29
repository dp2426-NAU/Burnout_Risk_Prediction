import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { backendFetch } from '@/lib/backend-fetch';
import { EmployeeDetail } from '@/components/dashboard/employee-detail';
import { EmployeeDashboardResponse } from '@/types/dashboard';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const employeeId = params.id ?? 'me';
  const data = await backendFetch<EmployeeDashboardResponse>(
    `/employee/dashboard/details/${encodeURIComponent(employeeId)}`,
    session,
  );

  return <EmployeeDetail employeeId={employeeId} initialData={data} />;
}
