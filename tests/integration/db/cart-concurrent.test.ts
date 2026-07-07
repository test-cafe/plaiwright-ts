import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createProductFactory } from '@/tests/fixtures/db/products';
import { createCartFactory } from '@/tests/fixtures/db/cart';

const prisma = useTestDb();
const productFactory = createProductFactory(prisma as any);
const cartFactory = createCartFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
});

describe('Cart DB — concurrent quantity updates', () => {
  it('concurrent PATCH quantity writes result in a valid positive quantity (last-write-wins)', async () => {
    const { items } = await productFactory.buildFullPizza();
    const cart = await cartFactory.buildAnonymous();
    const cartItem = await cartFactory.buildWithItem(cart.id, items[0].id, { quantity: 1 });

    await Promise.all([
      prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity: 3 } }),
      prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity: 5 } }),
    ]);

    const result = await prisma.cartItem.findUnique({ where: { id: cartItem.id } });
    expect(result!.quantity).toBeGreaterThan(0);
    expect([3, 5]).toContain(result!.quantity);
  });

  it('concurrent additions of different items create distinct CartItem rows', async () => {
    const { items } = await productFactory.buildFullPizza();
    const cart = await cartFactory.buildAnonymous();

    await Promise.all([
      cartFactory.buildWithItem(cart.id, items[0].id, { quantity: 1 }),
      cartFactory.buildWithItem(cart.id, items[1].id, { quantity: 1 }),
    ]);

    const cartItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    expect(cartItems).toHaveLength(2);
    expect(cartItems.every((item) => item.quantity > 0)).toBe(true);
  });

  it('concurrent totalAmount updates keep integer cents valid', async () => {
    const cart = await cartFactory.buildAnonymous();

    await Promise.all([
      prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 129950 } }),
      prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 149900 } }),
    ]);

    const updated = await prisma.cart.findUnique({ where: { id: cart.id } });
    expect(updated!.totalAmount).toBeGreaterThan(0);
    expect([129950, 149900]).toContain(updated!.totalAmount);
  });

  it('quantity never goes negative from a concurrent delete then update race', async () => {
    const { items } = await productFactory.buildFullPizza();
    const cart = await cartFactory.buildAnonymous();
    const cartItem = await cartFactory.buildWithItem(cart.id, items[0].id, { quantity: 2 });

    // Simulate: one request deletes the item while another tries to update its quantity
    const [deleteResult] = await Promise.allSettled([
      prisma.cartItem.delete({ where: { id: cartItem.id } }),
      prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity: 5 } }),
    ]);

    const remaining = await prisma.cartItem.findUnique({ where: { id: cartItem.id } });

    if (remaining) {
      // Update won: quantity must be positive
      expect(remaining.quantity).toBeGreaterThan(0);
    } else {
      // Delete won: item is gone, which is valid
      expect(remaining).toBeNull();
    }
  });
});
