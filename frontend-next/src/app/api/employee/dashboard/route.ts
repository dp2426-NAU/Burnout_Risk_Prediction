import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { backendFetch } from '@/lib/backend-fetch';
import { EmployeeDashboardResponse } from '@/types/dashboard';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await backendFetch<EmployeeDashboardResponse>('/employee/dashboard', session);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to load dashboard' }, { status: 500 });
  }
}
