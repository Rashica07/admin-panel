import { NovusPulse } from '@kiq/novus-pulse';
import { signOut } from 'next-auth/react';
import type { DefaultSession } from 'next-auth';

let sessionInvalidated = false;

/**
 * If the backend ever rejects our access token as unauthorized — expired
 * refresh token, or a token signed with an old JWT_SECRET after a key
 * rotation — NextAuth's own client-side expiry clock won't know to
 * refresh (it only refreshes when ITS timer says the token is old).
 * Force a clean re-login instead of every hook failing silently forever.
 */
function handleAuthError() {
  if (sessionInvalidated) return;
  sessionInvalidated = true;
  signOut({ callbackUrl: '/login?reason=session_expired' });
}

// Define the shape of our Session to include the custom token fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string | null;
      plan: string;
      status: string;
      tenantSlug: string | null;
    } & DefaultSession['user'];
    accessToken: string;
    error?: 'RefreshAccessTokenError';
  }

  interface User {
    id: string;
    role: string;
    tenantId: string | null;
    plan: string;
    status: string;
    tenantSlug: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string | null;
    plan: string;
    status: string;
    tenantSlug: string | null;
    accessTokenExpires: number;
    error?: 'RefreshAccessTokenError';
  }
}

/**
 * Helper to initialize the SDK manually given an access token.
 */
import { useUIStore } from '@/store/useStore';

export function createPulseClient(accessToken?: string) {
  const activeTenantId = useUIStore.getState().activeTenantId;
  return new NovusPulse({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    accessToken,
    tenantId: activeTenantId ?? undefined,
    onAuthError: handleAuthError,
  });
}
