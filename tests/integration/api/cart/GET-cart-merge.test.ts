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

const mockUser = { id: '2', email: 'user@test.com', role: 'USER' };

const mockAnonymousCart = {
  id: 1,
  totalAmount: 899,
  tokenId: 'anon-token-123',
  userId: null,
  items: [
    {
      id: 1,
      cartId: 1,
      productItemId: 5,
      quantity: 2,
      ingredients: [],
      productItem: { price: 449, product: { name: 'Margherita' } },
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
});

describe('GET /api/cart — post-login cart access', () => {
  it('logged-in user can access their anonymous cart via tokenId cookie (OR query)', async () => {
    setSession(vi.mocked(getUserSession), mockUser as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 2 });
    vi.mocked(prisma.cart.findFirst as any).mockResolvedValue(mockAnonymousCart);

    const response = await GET(request.get(urls.cart()).cartToken('anon-token-123').build());
    const body = await assertOkResponse(response, schemas.cart);

    expect(body.items).toHaveLength(1);
    expect(prisma.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ userId: 2 }, { tokenId: 'anon-token-123' }]),
        }),
      }),
    );
  });

  it('authenticated user without a cartToken cookie queries by userId only', async () => {
    setSession(vi.mocked(getUserSession), mockUser as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 2 });
    vi.mocked(prisma.cart.findFirst as any).mockResolvedValue(null);

    const response = await GET(request.get(urls.cart()).build());
    const body = await assertOkResponse(response, schemas.cart);

    expect(body.items).toEqual([]);
    expect(prisma.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ userId: 2 }] },
      }),
    );
  });

  it('returns empty items when no cart exists for either userId or tokenId', async () => {
    setSession(vi.mocked(getUserSession), { id: '9', email: 'new@test.com', role: 'USER' } as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 9 });
    vi.mocked(prisma.cart.findFirst as any).mockResolvedValue(null);

    const response = await GET(request.get(urls.cart()).cartToken('stale-token').build());
    const body = await assertOkResponse(response, schemas.cart);

    expect(body.items).toEqual([]);
  });
});
