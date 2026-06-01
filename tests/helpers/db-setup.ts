import { prisma } from '@/lib/prisma';
import { afterEach, afterAll } from 'vitest';

/**
 * Uses the app singleton (lib/prisma.ts) so tests share the same Prisma
 * instance — including the pagination() extension — as production code.
 *
 * Isolation strategy: Prisma's connection pool doesn't guarantee the same
 * underlying connection across calls, so raw BEGIN/ROLLBACK is unreliable.
 * Instead, each test file cleans up its own data in afterEach using known
 * identifiers (emails ending in @test.com, tokenIds prefixed with "test-").
 *
 * For fully isolated transaction-scoped tests, use prisma.$transaction()
 * directly inside the test body.
 */
export function useTestDb() {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  return prisma;
}

export { prisma as testPrisma };
