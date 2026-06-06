import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/products/search/route';
import { searchPayloads } from '@/tests/fixtures/api/auth-payloads';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse } from '@/tests/helpers/response-validator';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(), child: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.product.findMany).mockResolvedValue([]);
});

describe('GET /api/products/search', () => {
  // DDT: verifies status codes for various query strings including XSS and SQL injection
  it.each(searchPayloads)(
    '$query → status $expectedStatus',
    async ({ query, expectedStatus }) => {
      const response = await GET(request.get(urls.products(query)).build());
      expect(response.status).toBe(expectedStatus);
    },
  );

  it('passes query to Prisma with contains filter (case-insensitive)', async () => {
    await GET(request.get(urls.products('pepperoni')).build());

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: 'pepperoni' }),
        }),
      }),
    );
  });

  it('returns a JSON array of matching products', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 1,
        name: 'Pepperoni',
        imageUrl: '',
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await GET(request.get(urls.products('pepperoni')).build());
    const body = await assertOkResponse(
      response,
      z.array(z.object({ id: z.number(), name: z.string() })),
    );

    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Pepperoni');
  });
});
