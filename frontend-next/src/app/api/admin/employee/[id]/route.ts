import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { backendFetch } from '@/lib/backend-fetch';
import { EmployeeDashboardResponse } from '@/types/dashboard';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await backendFetch<EmployeeDashboardResponse>(
      `/admin/employee/${encodeURIComponent(params.id)}`,
      session,
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to load employee analytics' },
      { status: 500 },
    );
  }
}
