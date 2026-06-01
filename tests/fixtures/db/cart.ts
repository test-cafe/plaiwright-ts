import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

export function createCartFactory(prisma: PrismaClient) {
  return {
    async buildAnonymous(overrides: { tokenId?: string; totalAmount?: number } = {}) {
      return prisma.cart.create({
        data: {
          tokenId: overrides.tokenId ?? randomUUID(),
          totalAmount: overrides.totalAmount ?? 0,
        },
      });
    },

    async buildForUser(userId: number, overrides: { totalAmount?: number } = {}) {
      return prisma.cart.create({
        data: {
          userId,
          totalAmount: overrides.totalAmount ?? 0,
        },
      });
    },

    async buildWithItem(
      cartId: number,
      productItemId: number,
      overrides: { quantity?: number; ingredientIds?: number[] } = {},
    ) {
      const item = await prisma.cartItem.create({
        data: {
          cartId,
          productItemId,
          quantity: overrides.quantity ?? 1,
          ingredients: overrides.ingredientIds
            ? { connect: overrides.ingredientIds.map((id) => ({ id })) }
            : undefined,
        },
      });
      return item;
    },
  };
}
