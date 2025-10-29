"use client";

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { AppToaster } from '@/components/ui/toast';

const client = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <AppToaster />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
