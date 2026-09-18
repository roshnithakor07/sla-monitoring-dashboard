import { PrismaClient } from '@prisma/client';

// Reuse the client across invocations within the same Lambda execution
// environment instead of opening a new pool connection per request.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
