import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        // Prefer DIRECT_URL in local dev to avoid pooler connectivity issues.
        url:
          process.env.NODE_ENV === 'development'
            ? (process.env.DIRECT_URL ?? process.env.DATABASE_URL)
            : process.env.DATABASE_URL
      }
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
