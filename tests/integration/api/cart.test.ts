// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeCategory, makeProduct, makePizzaItem, makeIngredient } from '../../factories';

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn().mockResolvedValue(null),
}));

const CART_TOKEN = 'test-cart-token-abc';

function makeRequest(method: string, body?: object, extraHeaders?: Record<string, string>) {
  return new NextRequest('http://localhost/api/cart', {
    method,
    headers: {
      'Content-Type': 'application/json',
      cookie: `cartToken=${CART_TOKEN}`,
      ...extraHeaders,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function seedProductItem() {
  const category = await prisma.category.create({ data: makeCategory() });
  const product = await prisma.product.create({ data: makeProduct(category.id, { name: 'Margherita' }) });
  const item = await prisma.productItem.create({
    data: makePizzaItem(product.id, { price: 599, size: 30, pizzaType: 1 }),
  });
  return item;
}

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('GET /api/cart', () => {
  it('returns empty items when no cart token and no session', async () => {
    const { GET } = await import('@/app/api/cart/route');
    const req = new NextRequest('http://localhost/api/cart');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ items: [] });
  });

  it('returns empty items when cart does not exist for token', async () => {
    const { GET } = await import('@/app/api/cart/route');
    const res = await GET(makeRequest('GET'));
    const body = await res.json();

    expect(body).toEqual({ items: [] });
  });

  it('returns cart with items when cart exists', async () => {
    const { GET, POST } = await import('@/app/api/cart/route');
    const productItem = await seedProductItem();

    await POST(makeRequest('POST', { productItemId: productItem.id, quantity: 2, pizzaSize: 30, type: 1 }));

    const res = await GET(makeRequest('GET'));
    const body = await res.json();

    expect(body.items).toHaveLength(1);
    expect(body.items[0].quantity).toBe(2);
    expect(body.totalAmount).toBe(1198);
  });
});

describe('POST /api/cart', () => {
  it('creates cart and adds item', async () => {
    const { POST } = await import('@/app/api/cart/route');
    const productItem = await seedProductItem();

    const res = await POST(
      makeRequest('POST', { productItemId: productItem.id, quantity: 1, pizzaSize: 30, type: 1 }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.totalAmount).toBe(599);
    expect(res.cookies.get('cartToken')?.value).toBeDefined();
  });

  it('increments quantity when same item added again', async () => {
    const { POST } = await import('@/app/api/cart/route');
    const productItem = await seedProductItem();
    const payload = { productItemId: productItem.id, quantity: 1, pizzaSize: 30, type: 1 };

    await POST(makeRequest('POST', payload));
    const res = await POST(makeRequest('POST', payload));
    const body = await res.json();

    expect(body.items).toHaveLength(1);
    expect(body.items[0].quantity).toBe(2);
    expect(body.totalAmount).toBe(1198);
  });

  it('adds item with extra ingredients and recalculates total', async () => {
    const { POST } = await import('@/app/api/cart/route');
    const productItem = await seedProductItem();
    const ing = await prisma.ingredient.create({ data: makeIngredient({ price: 100 }) });

    const res = await POST(
      makeRequest('POST', {
        productItemId: productItem.id,
        quantity: 1,
        pizzaSize: 30,
        type: 1,
        ingredientsIds: [ing.id],
      }),
    );
    const body = await res.json();

    expect(body.totalAmount).toBe(699);
    expect(body.items[0].ingredients).toHaveLength(1);
  });
});

describe('DELETE /api/cart', () => {
  it('clears all items from cart', async () => {
    const { POST, DELETE } = await import('@/app/api/cart/route');
    const productItem = await seedProductItem();

    await POST(makeRequest('POST', { productItemId: productItem.id, quantity: 2, pizzaSize: 30, type: 1 }));

    const res = await DELETE(makeRequest('DELETE'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(0);
    expect(body.totalAmount).toBe(0);
  });

  it('returns 400 when no token and no session', async () => {
    const { DELETE } = await import('@/app/api/cart/route');
    const req = new NextRequest('http://localhost/api/cart', { method: 'DELETE' });

    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe('Cart token not found');
  });

  it('returns 404 when cart does not exist', async () => {
    const { DELETE } = await import('@/app/api/cart/route');

    const res = await DELETE(makeRequest('DELETE'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toBe('Cart not found');
  });
});
