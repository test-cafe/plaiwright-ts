import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cart/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { setSession, clearSession, mockRegularUser } from '@/tests/helpers/auth-setup';
import { buildCartRecord, buildUserRecord } from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cart: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn(),
}));

const ANON_CART_TOKEN = 'test-token';
const MOBILE_CART_TOKEN = 'mobile-token';
const UNKNOWN_CART_TOKEN = 'unknown-token';
const CART_TOTAL = 699;
const REGULAR_USER_DB_ID = Number(mockRegularUser.id);

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
});

describe('GET /api/cart', () => {
  describe('anonymous user lookup', () => {
    it('looks up the cart by cookie cartToken', async () => {
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(buildCartRecord({ tokenId: ANON_CART_TOKEN }));

      const response = await GET(request.get(urls.cart()).cartToken(ANON_CART_TOKEN).build());

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ tokenId: ANON_CART_TOKEN }]),
          }),
        }),
      );
    });

    it('looks up the cart by x-cart-token header (mobile)', async () => {
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(buildCartRecord({ tokenId: MOBILE_CART_TOKEN }));

      const response = await GET(
        request.get(urls.cart()).header('x-cart-token', MOBILE_CART_TOKEN).build(),
      );

      await assertOkResponse(response, schemas.cart);
    });
  });

  describe('authenticated user lookup', () => {
    it('looks up the cart by userId for an authenticated user', async () => {
      setSession(vi.mocked(getUserSession), mockRegularUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUserRecord({ id: REGULAR_USER_DB_ID }));
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(buildCartRecord({ userId: REGULAR_USER_DB_ID }));

      const response = await GET(request.get(urls.cart()).build());

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: REGULAR_USER_DB_ID },
        }),
      );
    });
  });

  describe('empty results', () => {
    it('returns an empty items array when no cart is found', async () => {
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

      const response = await GET(request.get(urls.cart()).cartToken(UNKNOWN_CART_TOKEN).build());
      const body = await assertOkResponse(response, schemas.cart);

      expect(body.items).toEqual([]);
    });
  });
});
