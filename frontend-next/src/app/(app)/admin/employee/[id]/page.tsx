import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { backendFetch } from '@/lib/backend-fetch';
import { AdminEmployeeDetail } from '@/components/dashboard/admin-employee-detail';
import { EmployeeDashboardResponse } from '@/types/dashboard';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AdminEmployeePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  if ((session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const data = await backendFetch<EmployeeDashboardResponse>(
    `/admin/employee/${encodeURIComponent(params.id)}`,
    session,
  );

  return <AdminEmployeeDetail employeeId={params.id} initialData={data} />;
}
