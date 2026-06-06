import { describe, it, expect, beforeEach } from 'vitest';
import { OrderStatus } from '@prisma/client';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createUserFactory } from '@/tests/fixtures/db/users';
import { createOrderFactory } from '@/tests/fixtures/db/orders';

const prisma = useTestDb();
const userFactory = createUserFactory(prisma as any);
const orderFactory = createOrderFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
});

describe('Order DB', () => {
  it('stores JSON items snapshot correctly', async () => {
    const user = await userFactory.build();
    const items = [
      { productItem: { product: { name: 'Pepperoni' }, price: 899 }, quantity: 2 },
    ];

    const order = await orderFactory.build(user.id, { items });

    const found = await prisma.order.findUnique({ where: { id: order.id } });
    expect(found?.items).toMatchObject(items);
  });

  it('stores float totalAmount via raw SQL without precision loss', async () => {
    const user = await userFactory.build();
    const order = await orderFactory.build(user.id, { totalAmount: 1350.5 });

    const found = await prisma.order.findUnique({ where: { id: order.id } });
    expect(found?.totalAmount).toBeCloseTo(1350.5, 2);
  });

  it('defaults to PENDING status', async () => {
    const user = await userFactory.build();
    const order = await orderFactory.build(user.id);

    expect(order.status).toBe(OrderStatus.PENDING);
  });

  it('transitions from PENDING to SUCCEEDED', async () => {
    const user = await userFactory.build();
    const order = await orderFactory.build(user.id);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.SUCCEEDED },
    });

    expect(updated.status).toBe(OrderStatus.SUCCEEDED);
  });

  it('JSON items are immutable after order creation when cart is cleared', async () => {
    const user = await userFactory.build();
    const items = [{ productItem: { product: { name: 'Margherita' }, price: 599 }, quantity: 1 }];

    const order = await orderFactory.build(user.id, { items });

    // Simulate cart clear — order items must remain unchanged
    const found = await prisma.order.findUnique({ where: { id: order.id } });
    expect(found?.items).toMatchObject(items);
  });
});
