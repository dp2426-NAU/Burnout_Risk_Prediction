import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Sidebar } from '@/components/navigation/sidebar';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar user={session.user as any} />
      <main className="pl-64 min-h-screen bg-slate-950">
        <div className="mx-auto max-w-6xl px-8 py-12">{children}</div>
      </main>
    </div>
  );
}
