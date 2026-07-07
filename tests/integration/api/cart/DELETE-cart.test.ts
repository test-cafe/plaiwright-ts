import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/cart/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertStatus, schemas } from '@/tests/helpers/response-validator';
import { clearSession, setSession, mockRegularUser } from '@/tests/helpers/auth-setup';
import { buildCartWithDeepItems, buildUserRecord } from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
    cart: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(), child: vi.fn() },
}));

const CART_ID = 1;
const ANON_CART_TOKEN = 'test-token';
const GHOST_CART_TOKEN = 'ghost-token';
const ITEMS_DELETED_COUNT = 2;
const REGULAR_USER_DB_ID = Number(mockRegularUser.id);

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
  vi.mocked(prisma.cart.findFirst).mockResolvedValue(
    buildCartWithDeepItems({ id: CART_ID, tokenId: ANON_CART_TOKEN }),
  );
  vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: ITEMS_DELETED_COUNT });
  vi.mocked(prisma.cart.update).mockImplementation(async ({ data }) => ({
    ...buildCartWithDeepItems({ id: CART_ID, tokenId: ANON_CART_TOKEN }),
    totalAmount: data.totalAmount as number,
  }));
});

describe('DELETE /api/cart', () => {
  describe('anonymous flow', () => {
    it('clears all items in the cart matched by cartToken', async () => {
      const response = await DELETE(
        request.delete(urls.cart()).cartToken(ANON_CART_TOKEN).build(),
      );

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cartId: CART_ID } }),
      );
    });
  });

  describe('authenticated flow', () => {
    it('clears all items in the cart matched by userId', async () => {
      setSession(vi.mocked(getUserSession), mockRegularUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUserRecord({ id: REGULAR_USER_DB_ID }));
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(
        buildCartWithDeepItems({ id: CART_ID, userId: REGULAR_USER_DB_ID }),
      );

      const response = await DELETE(request.delete(urls.cart()).build());

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cartId: CART_ID } }),
      );
    });
  });

  describe('error cases', () => {
    it('returns 400 when there is no cart token and no session', async () => {
      const response = await DELETE(request.delete(urls.cart()).build());

      assertStatus(response, 400);
      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    });

    it('returns 404 when no cart matches the given token', async () => {
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

      const response = await DELETE(
        request.delete(urls.cart()).cartToken(GHOST_CART_TOKEN).build(),
      );

      assertStatus(response, 404);
      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    });

    it('returns 500 when the database throws', async () => {
      vi.mocked(prisma.cart.findFirst).mockRejectedValue(new Error('DB crash'));

      const response = await DELETE(
        request.delete(urls.cart()).cartToken(ANON_CART_TOKEN).build(),
      );

      assertStatus(response, 500);
    });
  });
});
