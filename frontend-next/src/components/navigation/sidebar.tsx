"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { Role } from '@/types/common';
import { BarChart3, Shield, Users } from 'lucide-react';

type SidebarProps = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
  };
};

const employeeLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
];

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin', label: 'Admin Overview', icon: Users },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = user.role === 'ADMIN' ? adminLinks : employeeLinks;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-900/90 backdrop-blur border-r border-white/10 p-6 lg:flex">
      <div className="flex items-center space-x-2 text-white mb-8">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Burnout Risk</h2>
          <p className="text-xs text-white/60">Hybrid teams analytics</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary/20 text-white' : 'text-white/70 hover:bg-white/10',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 text-sm text-white/80">
        <div>
          <p className="font-semibold">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-white/60">{user.email}</p>
          <p className="text-xs text-white/60 capitalize">{user.role.toLowerCase()}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
