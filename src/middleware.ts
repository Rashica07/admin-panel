import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // If we have an error refreshing the token, we can catch it here or in a client component
    // But for now, withAuth handles the basic unauthenticated redirects.
    return NextResponse.next();
  },
  {
    // Demo mode ships with a fixed, non-secret signing key (there is no real data to protect).
    secret:
      process.env.NEXTAUTH_SECRET ||
      (process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' ? 'novus-demo-secret-not-for-production' : undefined),
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  // /portal is the client-facing chat surface — same auth, no dashboard UI
  matcher: ['/dashboard/:path*', '/portal/:path*'],
};
