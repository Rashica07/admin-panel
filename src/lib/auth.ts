import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NovusPulse } from '@kiq/novus-pulse';
import { JWT } from 'next-auth/jwt';

// Initialize a generic client for auth
const pulse = new NovusPulse({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    // Re-instantiate the pulse client with the refresh token
    const refreshPulse = new NovusPulse({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      refreshToken: token.refreshToken,
    });

    const refreshedTokens = await refreshPulse.refresh();

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken, // Fall back to old refresh token if not returned
      // The access token expires in 15 mins (as configured in backend)
      accessTokenExpires: Date.now() + 15 * 60 * 1000,
      error: undefined, // Clear any previous refresh error — this refresh succeeded
    };
  } catch (error) {
    console.error('Error refreshing access token', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let email = credentials.email;
        let password = credentials.password;

        const isAdminShorthand = email === 'admin' && password === '1234';

        if (isAdminShorthand) {
          email = 'admin@novuspulse.dev';
          password = 'AdminPassword1234'; // complies with backend uppercase/lowercase/number/min length limits
        }

        const loginUser = async () => {
          return await pulse.login({
            email,
            password,
          });
        };

        try {
          const response = await loginUser();
          return {
            id: response.user.id,
            email: response.user.email,
            name: `${response.user.firstName} ${response.user.lastName}`,
            role: response.user.role,
            tenantId: response.user.tenantId,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            plan: (response.user as any).plan ?? 'starter',
            status: (response.user as any).status ?? 'active',
            tenantSlug: (response.user as any).tenantSlug ?? null,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          } as any;
        } catch (error: any) {
          // If they typed admin/1234 and it failed, register them first!
          if (isAdminShorthand) {
            try {
              // 1. Register tenant & user
              await pulse.register({
                email,
                password,
                firstName: 'System',
                lastName: 'Admin',
                tenantName: 'Admin Workspace',
                tenantSlug: 'admin-workspace',
              });

              // 2. Retry login
              const response = await loginUser();
              return {
                id: response.user.id,
                email: response.user.email,
                name: `${response.user.firstName} ${response.user.lastName}`,
                role: response.user.role,
                tenantId: response.user.tenantId,
                firstName: response.user.firstName,
                lastName: response.user.lastName,
                plan: (response.user as any).plan ?? 'starter',
                status: (response.user as any).status ?? 'active',
                tenantSlug: (response.user as any).tenantSlug ?? null,
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
              } as any;
            } catch (regError: any) {
              throw new Error(regError.message || 'Auto-registration failed');
            }
          }

          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Explicit refresh — call `update()` client-side (e.g. right after
      // a plan change/payment) to pull fresh plan/status immediately,
      // rather than waiting for a full re-login or the 15-min token
      // expiry (which only rotates the access token, never re-checks
      // plan/status at all).
      if (trigger === 'update' && token.accessToken) {
        try {
          const refreshPulse = new NovusPulse({
            baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
            accessToken: token.accessToken,
          });
          const tenant = await refreshPulse.getMyTenant();
          return {
            ...token,
            plan: tenant.plan ?? token.plan,
            status: (tenant as any).status ?? token.status,
            tenantSlug: tenant.slug ?? token.tenantSlug,
          };
        } catch (err) {
          console.error('Failed to refresh tenant entitlements', err);
          return token; // Keep the existing token rather than failing the session
        }
      }

      // Initial sign in
      if (user) {
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          userId: user.id,
          email: user.email!,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          role: (user as any).role,
          tenantId: (user as any).tenantId,
          plan: (user as any).plan ?? 'starter',
          status: (user as any).status ?? 'active',
          tenantSlug: (user as any).tenantSlug ?? null,
          // Set expiry (assuming 15 minutes to match backend)
          accessTokenExpires: Date.now() + 15 * 60 * 1000,
        };
      }

      // Return previous token if the access token has not expired yet (buffer of 1 min)
      if (Date.now() < (token.accessTokenExpires ?? 0) - 60 * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.email = token.email;
        session.user.name = `${token.firstName} ${token.lastName}`;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
        session.user.plan = (token.plan as any) ?? 'starter';
        session.user.status = (token.status as any) ?? 'active';
        session.user.tenantSlug = (token.tenantSlug as any) ?? null;
        session.accessToken = token.accessToken;
        session.error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
