import { PrismaClient } from '@prisma/client';

const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  console.warn('Warning: No TEST_DATABASE_URL or DATABASE_URL set. Database tests may fail.');
}

// Only create a real Prisma client if a database URL is available
export const prisma = testDatabaseUrl
  ? new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl,
        },
      },
    })
  : (null as unknown as PrismaClient);

beforeAll(async () => {
  if (prisma) {
    await prisma.$connect();
  }
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});
