import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const path = nextUrl.pathname;

      // Handle role-based route protection
      if (path.startsWith('/admin')) {
        if (!isLoggedIn) return false;
        return role === 'ADMIN';
      }
      if (path.startsWith('/cashier')) {
        if (!isLoggedIn) return false;
        return role === 'CASHIER' || role === 'ADMIN';
      }
      if (path.startsWith('/barista')) {
        if (!isLoggedIn) return false;
        return role === 'BARISTA' || role === 'ADMIN';
      }

      // Customer paths (e.g. /menu, /menu/[table]) do not require login
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).username = token.username as string;
      }
      return session;
    },
  },
  providers: [], // configured in auth.ts
} satisfies NextAuthConfig;
