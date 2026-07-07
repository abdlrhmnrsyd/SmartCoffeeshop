import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          
          const user = await prisma.user.findUnique({
            where: { username },
            include: { role: true },
          });
          
          if (!user) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              role: user.role.name,
            };
          }
        }

        return null;
      },
    }),
  ],
});
