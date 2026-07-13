import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // If we have an error refreshing the token, we can catch it here or in a client component
    // But for now, withAuth handles the basic unauthenticated redirects.
    return NextResponse.next();
  },
  {
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
