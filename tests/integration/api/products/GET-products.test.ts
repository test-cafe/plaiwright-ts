import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/products/route';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse } from '@/tests/helpers/response-validator';
import { z } from 'zod';

vi.mock('@/lib/find-pizzas', () => ({
  findPizzas: vi.fn(),
}));

import { findPizzas } from '@/lib/find-pizzas';

const defaultMeta = {
  totalCount: 0,
  pageCount: 1,
  currentPage: 1,
  isFirstPage: true,
  isLastPage: true,
};

const responseSchema = z.object({
  categories: z.array(z.unknown()),
  meta: z.object({ totalCount: z.number() }).passthrough(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findPizzas).mockResolvedValue([[], defaultMeta] as any);
});

describe('GET /api/products', () => {
  it('returns categories and meta in the response body', async () => {
    const response = await GET(request.get(urls.products()).build());

    const body = await assertOkResponse(response, responseSchema);
    expect(Array.isArray(body.categories)).toBe(true);
    expect(body.meta).toBeDefined();
  });

  it('passes query string params to findPizzas', async () => {
    const req = request.get(urls.products('pizza')).build();

    await GET(req);

    expect(findPizzas).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'pizza' }),
    );
  });

  it('returns categories supplied by findPizzas', async () => {
    const fakeCategory = { id: 1, name: 'Pizzas', products: [] };
    vi.mocked(findPizzas).mockResolvedValue([[fakeCategory], defaultMeta] as any);

    const response = await GET(request.get(urls.products()).build());

    const body = await response.json();
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].name).toBe('Pizzas');
  });

  it('returns 200 when no products match the filter', async () => {
    vi.mocked(findPizzas).mockResolvedValue([[], { ...defaultMeta, totalCount: 0 }] as any);

    const response = await GET(request.get(urls.products()).build());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.categories).toHaveLength(0);
  });
});
