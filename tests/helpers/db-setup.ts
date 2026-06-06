import { prisma } from '@/lib/prisma';
import { afterAll } from 'vitest';

/**
 * Uses the app singleton (lib/prisma.ts) so tests share the same Prisma
 * instance — including the pagination() extension — as production code.
 *
 * Isolation strategy: call cleanDb() in beforeEach to wipe all tables in
 * FK-safe order before each test. The test:integration script enforces
 * maxForks=1 so DB test files never run concurrently.
 *
 * Prisma's connection pool doesn't guarantee the same underlying connection
 * across calls, so raw BEGIN/ROLLBACK is unreliable — full truncation is used
 * instead.
 */
export function useTestDb() {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  return prisma;
}

/**
 * Wipes all tables in FK-safe order. Call in beforeEach for DB integration tests.
 * Delete order: children before parents, M2M join tables are implicit (handled
 * by Prisma when the owning side is deleted).
 */
export async function cleanDb() {
  await prisma.cartItem.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storyItem.deleteMany();
  await prisma.story.deleteMany();
}

export { prisma as testPrisma };
