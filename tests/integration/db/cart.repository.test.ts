import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb } from '@/tests/helpers/db-setup';
import { createUserFactory } from '@/tests/fixtures/db/users';
import { createProductFactory } from '@/tests/fixtures/db/products';
import { createCartFactory } from '@/tests/fixtures/db/cart';

// Uses the app singleton — same connection + pagination() extension as production
const prisma = useTestDb();
const userFactory = createUserFactory(prisma as any);
const productFactory = createProductFactory(prisma as any);
const cartFactory = createCartFactory(prisma as any);

// Clean up created data after each test
beforeEach(async () => {
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
});

describe('Cart DB — deduplication', () => {
  it('two separate items with different productItemId creates two CartItems', async () => {
    const { items } = await productFactory.buildFullPizza();
    const cart = await cartFactory.buildAnonymous();

    await cartFactory.buildWithItem(cart.id, items[0].id);
    await cartFactory.buildWithItem(cart.id, items[1].id);

    const cartItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    expect(cartItems).toHaveLength(2);
  });

  it('anonymous cart resolves by tokenId', async () => {
    const token = 'test-token-abc-123';
    const cart = await cartFactory.buildAnonymous({ tokenId: token });

    const found = await prisma.cart.findFirst({ where: { tokenId: token } });
    expect(found?.id).toBe(cart.id);
  });
});

describe('Cart DB — anonymous cart merge', () => {
  it('assigning userId to anonymous cart links it to the user', async () => {
    const user = await userFactory.build();
    const cart = await cartFactory.buildAnonymous({ tokenId: 'merge-token' });

    const merged = await prisma.cart.update({
      where: { id: cart.id },
      data: { userId: user.id },
    });

    expect(merged.userId).toBe(user.id);
    expect(merged.tokenId).toBe('merge-token');
  });
});

describe('Cart DB — totalAmount Float precision', () => {
  it('stores float totalAmount correctly via raw SQL', async () => {
    const cart = await cartFactory.buildAnonymous();

    await prisma.$executeRaw`
      UPDATE "Cart" SET "totalAmount" = ${1350.5}::float8 WHERE id = ${cart.id}
    `;

    const updated = await prisma.cart.findUnique({ where: { id: cart.id } });
    expect(updated?.totalAmount).toBeCloseTo(1350.5, 2);
  });
});

describe('Cart DB — cascade on user delete', () => {
  it('deleting a user removes their cart', async () => {
    const user = await userFactory.build();
    await cartFactory.buildForUser(user.id);

    await prisma.user.delete({ where: { id: user.id } });

    const cart = await prisma.cart.findFirst({ where: { userId: user.id } });
    expect(cart).toBeNull();
  });
});
