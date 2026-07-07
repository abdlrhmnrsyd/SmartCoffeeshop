import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Match all routes except static assets, images, API routes, and auth callback endpoints
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|file\\.svg).*)'
  ],
};
