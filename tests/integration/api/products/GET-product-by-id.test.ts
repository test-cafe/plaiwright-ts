import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/products/[id]/route';
import { assertOkResponse } from '@/tests/helpers/response-validator';
import { schemas } from '@/tests/helpers/response-validator';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const fakeProduct = {
  id: 1,
  name: 'Margherita',
  imageUrl: 'https://example.com/margherita.png',
  categoryId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ingredients: [{ id: 10, name: 'Cheese', price: 50, imageUrl: '', createdAt: new Date(), updatedAt: new Date() }],
  items: [
    {
      id: 100,
      productId: 1,
      price: 599,
      size: 30,
      pizzaType: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: { id: 1, name: 'Margherita', items: [] },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/products/[id]', () => {
  it('returns the product with ingredients and items', async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(fakeProduct as any);

    const response = await GET(new Request('http://localhost/api/products/1'), makeParams('1'));

    await assertOkResponse(response, schemas.product);
  });

  it('returns null body (200) when product does not exist', async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/products/999'), makeParams('999'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toBeNull();
  });

  it('queries by the numeric id parsed from the URL segment', async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(fakeProduct as any);

    await GET(new Request('http://localhost/api/products/7'), makeParams('7'));

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 } }),
    );
  });

  it('includes ingredients and items with nested product in the query', async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(fakeProduct as any);

    await GET(new Request('http://localhost/api/products/1'), makeParams('1'));

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          ingredients: true,
          items: expect.objectContaining({ include: expect.anything() }),
        }),
      }),
    );
  });
});
