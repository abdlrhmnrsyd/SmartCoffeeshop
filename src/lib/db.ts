import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const getPrismaClient = () => {
  const rawUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/smart_coffee_shop';
  const connectionString = rawUrl.replace(/^mysql:/, 'mariadb:');

  const adapter = new PrismaMariaDb(connectionString);
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
