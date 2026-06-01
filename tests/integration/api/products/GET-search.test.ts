import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/products/search/route';
import { NextRequest } from 'next/server';
import { searchPayloads } from '@/tests/fixtures/api/auth-payloads';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

const makeRequest = (query: string) =>
  new NextRequest(`http://localhost:3000/api/products/search?query=${encodeURIComponent(query)}`);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.product.findMany).mockResolvedValue([]);
});

describe('GET /api/products/search', () => {
  // DDT: various query string inputs including XSS and SQL injection
  it.each(searchPayloads)(
    '$query → status $expectedStatus',
    async ({ query, expectedStatus }) => {
      const response = await GET(makeRequest(query));
      expect(response.status).toBe(expectedStatus);
    },
  );

  it('passes query to Prisma with contains filter (case-insensitive)', async () => {
    await GET(makeRequest('pepperoni'));

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({
            contains: 'pepperoni',
          }),
        }),
      }),
    );
  });

  it('returns JSON array', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: 1, name: 'Pepperoni', imageUrl: '', categoryId: 1, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const response = await GET(makeRequest('pepperoni'));
    const body = await response.json();

    expect(Array.isArray(body)).toBe(true);
  });
});
