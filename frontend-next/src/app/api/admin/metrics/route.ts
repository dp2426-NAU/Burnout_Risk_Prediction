import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { backendFetch } from '@/lib/backend-fetch';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await backendFetch<Record<string, any>>('/admin/metrics', session);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to load metrics' }, { status: 500 });
  }
}
