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

  const targetId = params.id || 'me';

  try {
    const data = await backendFetch<EmployeeDashboardResponse>(
      `/employee/dashboard/details/${encodeURIComponent(targetId)}`,
      session,
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to load detailed analytics' },
      { status: 500 },
    );
  }
}
