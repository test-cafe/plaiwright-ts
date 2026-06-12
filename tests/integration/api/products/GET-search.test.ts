import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { GET } from '@/app/api/products/search/route';
import { prisma } from '@/lib/prisma';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { searchPayloads } from '@/tests/fixtures/api/auth-payloads';
import { buildProductRecord } from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  },
}));

const QUERY = 'pepperoni';
const PRODUCT_ID = 1;
const PRODUCT_NAME = 'Pepperoni';
const RESULT_LIMIT = 5;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.product.findMany).mockResolvedValue([]);
});

describe('GET /api/products/search', () => {
  describe('input handling', () => {
    it.each(searchPayloads)(
      'returns $expectedStatus for query "$query"',
      async ({ query, expectedStatus }) => {
        const response = await GET(request.get(urls.products(query)).build());

        expect(response.status).toBe(expectedStatus);
      },
    );
  });

  describe('query forwarding', () => {
    it('passes the query to Prisma with a case-insensitive contains filter', async () => {
      await GET(request.get(urls.products(QUERY)).build());

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({ contains: QUERY, mode: 'insensitive' }),
          }),
        }),
      );
    });

    it('limits results to the search cap', async () => {
      await GET(request.get(urls.products(QUERY)).build());

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: RESULT_LIMIT }),
      );
    });
  });

  describe('response shape', () => {
    it('returns the matching products as a JSON array', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        buildProductRecord({ id: PRODUCT_ID, name: PRODUCT_NAME }),
      ]);

      const response = await GET(request.get(urls.products(QUERY)).build());

      const body = await assertOkResponse(response, z.array(schemas.productSearchResult));
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ id: PRODUCT_ID, name: PRODUCT_NAME });
    });
  });
});
