import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cart/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { setSession, clearSession } from '@/tests/helpers/auth-setup';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cart: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn(),
}));

const mockCart = {
  id: 1,
  totalAmount: 699,
  tokenId: 'test-token',
  userId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
});

describe('GET /api/cart', () => {
  it('returns cart by cookie cartToken for anonymous user', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

    const response = await GET(request.get(urls.cart()).cartToken('test-token').build());

    await assertOkResponse(response, schemas.cart);
    expect(prisma.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: expect.arrayContaining([{ tokenId: 'test-token' }]) },
      }),
    );
  });

  it('returns cart by x-cart-token header (mobile)', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

    const response = await GET(
      request.get(urls.cart()).header('x-cart-token', 'mobile-token').build(),
    );

    await assertOkResponse(response, schemas.cart);
  });

  it('returns cart by userId for authenticated user', async () => {
    setSession(vi.mocked(getUserSession), { id: '2', email: 'user@test.com', role: 'USER' } as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 2 });
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({ ...mockCart, userId: 2 } as any);

    const response = await GET(request.get(urls.cart()).build());

    await assertOkResponse(response, schemas.cart);
  });

  it('returns empty items array when no cart found', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

    const response = await GET(request.get(urls.cart()).cartToken('unknown-token').build());
    const body = await assertOkResponse(response, schemas.cart);

    expect(body.items).toEqual([]);
  });
});
