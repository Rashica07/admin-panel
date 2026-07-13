'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

/**
 * Watches the session for a failed token refresh and forces a clean
 * re-login instead of leaving the user "logged in" with a dead token
 * (which makes every API call throw Unauthorized forever).
 */
function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      toast.error('Session expired', { description: 'Please sign in again.' });
      signOut({ callbackUrl: '/login' });
    }
  }, [session?.error]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <SessionGuard>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster theme="dark" richColors position="top-right" />
        </QueryClientProvider>
      </SessionGuard>
    </SessionProvider>
  );
}
