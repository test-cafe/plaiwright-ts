import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeUser, makeOrder } from '../../factories';
import { OrderStatus } from '@prisma/client';

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('Order model', () => {
  it('creates a pending order for a user', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const data = makeOrder(user.id, { totalAmount: 1500 });

    const order = await prisma.order.create({ data });

    expect(order.id).toBeDefined();
    expect(order.userId).toBe(user.id);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.totalAmount).toBe(1500);
  });

  it('stores delivery details', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const data = makeOrder(user.id, {
      fullName: 'John Doe',
      address: '123 Main St',
      email: 'john@example.com',
      phone: '+79991234567',
      comment: 'Ring twice',
    });

    const order = await prisma.order.create({ data });

    expect(order.fullName).toBe('John Doe');
    expect(order.address).toBe('123 Main St');
    expect(order.comment).toBe('Ring twice');
  });

  it('transitions status to SUCCEEDED', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const order = await prisma.order.create({ data: makeOrder(user.id) });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.SUCCEEDED, paymentId: 'pi_stripe_123' },
    });

    expect(updated.status).toBe(OrderStatus.SUCCEEDED);
    expect(updated.paymentId).toBe('pi_stripe_123');
  });

  it('transitions status to CANCELLED', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const order = await prisma.order.create({ data: makeOrder(user.id) });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });

    expect(updated.status).toBe(OrderStatus.CANCELLED);
  });

  it('fetches all orders for a user', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    await prisma.order.createMany({
      data: [makeOrder(user.id), makeOrder(user.id), makeOrder(user.id)],
    });

    const orders = await prisma.order.findMany({ where: { userId: user.id } });

    expect(orders).toHaveLength(3);
  });

  it('fetches order with user relation', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const order = await prisma.order.create({ data: makeOrder(user.id) });

    const found = await prisma.order.findUnique({
      where: { id: order.id },
      include: { user: true },
    });

    expect(found!.user.email).toBe(user.email);
  });

  it('stores items as JSON', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const items = [{ name: 'Margherita', quantity: 2, price: 599 }];
    const order = await prisma.order.create({
      data: makeOrder(user.id, { items }),
    });

    expect(order.items).toEqual(items);
  });
});
