// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeCategory, makeProduct, makePizzaItem, makeCart, makeCartItem } from '../../factories';

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn().mockResolvedValue(null),
}));

const CART_TOKEN = 'test-cart-item-token';

function makeRequest(method: string, id: number, body?: object) {
  return new NextRequest(`http://localhost/api/cart/${id}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      cookie: `cartToken=${CART_TOKEN}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function seedCartWithItem() {
  const category = await prisma.category.create({ data: makeCategory() });
  const product = await prisma.product.create({ data: makeProduct(category.id) });
  const productItem = await prisma.productItem.create({
    data: makePizzaItem(product.id, { price: 599 }),
  });
  const cart = await prisma.cart.create({ data: makeCart({ tokenId: CART_TOKEN }) });
  const cartItem = await prisma.cartItem.create({
    data: makeCartItem(cart.id, productItem.id, { quantity: 2 }),
  });
  return { cart, cartItem, productItem };
}

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('PATCH /api/cart/[id]', () => {
  it('updates cart item quantity and recalculates total', async () => {
    const { PATCH } = await import('@/app/api/cart/[id]/route');
    const { cartItem } = await seedCartWithItem();

    const res = await PATCH(makeRequest('PATCH', cartItem.id, { quantity: 5 }), {
      params: Promise.resolve({ id: String(cartItem.id) }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items[0].quantity).toBe(5);
    expect(body.totalAmount).toBe(2995);
  });

  it('returns error when cart item not found', async () => {
    const { PATCH } = await import('@/app/api/cart/[id]/route');

    const res = await PATCH(makeRequest('PATCH', 99999, { quantity: 1 }), {
      params: Promise.resolve({ id: '99999' }),
    });
    const body = await res.json();

    expect(body.error).toBe('Cart item not found');
  });

  it('returns error when no token and no session', async () => {
    const { PATCH } = await import('@/app/api/cart/[id]/route');
    const req = new NextRequest('http://localhost/api/cart/1', {
      method: 'PATCH',
      body: JSON.stringify({ quantity: 1 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(body.error).toBe('Cart token not found');
  });
});

describe('DELETE /api/cart/[id]', () => {
  it('removes cart item and recalculates total', async () => {
    const { DELETE } = await import('@/app/api/cart/[id]/route');
    const { cartItem } = await seedCartWithItem();

    const res = await DELETE(makeRequest('DELETE', cartItem.id), {
      params: Promise.resolve({ id: String(cartItem.id) }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(0);
    expect(body.totalAmount).toBe(0);
  });

  it('returns error when cart item not found', async () => {
    const { DELETE } = await import('@/app/api/cart/[id]/route');

    const res = await DELETE(makeRequest('DELETE', 99999), { params: Promise.resolve({ id: '99999' }) });
    const body = await res.json();

    expect(body.error).toBe('Cart item not found');
  });
});
