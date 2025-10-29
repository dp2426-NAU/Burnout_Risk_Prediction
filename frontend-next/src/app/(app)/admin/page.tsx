import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { backendFetch } from '@/lib/backend-fetch';
import { AdminOverview } from '@/components/dashboard/admin-overview';
import { AdminDashboardResponse } from '@/types/dashboard';

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  if ((session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const data = await backendFetch<AdminDashboardResponse>('/admin/employees', session);

  return <AdminOverview initialData={data} />;
}
