import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createUserFactory } from '@/tests/fixtures/db/users';
import { createProductFactory } from '@/tests/fixtures/db/products';
import { createCartFactory } from '@/tests/fixtures/db/cart';

const prisma = useTestDb();
const userFactory = createUserFactory(prisma as any);
const productFactory = createProductFactory(prisma as any);
const cartFactory = createCartFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
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

describe('Cart DB — totalAmount integer cents', () => {
  it('stores totalAmount as integer cents', async () => {
    const cart = await cartFactory.buildAnonymous();

    await prisma.cart.update({
      where: { id: cart.id },
      data: { totalAmount: 135050 },
    });

    const updated = await prisma.cart.findUnique({ where: { id: cart.id } });
    expect(updated?.totalAmount).toBe(135050);
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
