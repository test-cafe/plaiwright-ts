import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/cart/[id]/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertStatus, schemas } from '@/tests/helpers/response-validator';
import { clearSession, setSession, mockRegularUser } from '@/tests/helpers/auth-setup';
import {
  buildCartRecord,
  buildCartWithDeepItems,
  buildCartItemRecord,
  buildUserRecord,
} from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cartItem: { findFirst: vi.fn(), delete: vi.fn() },
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
const CART_ITEM_ID = 1;
const PRODUCT_ITEM_ID = 10;
const ANON_CART_TOKEN = 'test-token';
const REGULAR_USER_DB_ID = Number(mockRegularUser.id);

const cartItemRecord = buildCartItemRecord({
  id: CART_ITEM_ID,
  cartId: CART_ID,
  productItemId: PRODUCT_ITEM_ID,
});

const params = { params: Promise.resolve({ id: String(CART_ITEM_ID) }) };

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
  vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(cartItemRecord);
  vi.mocked(prisma.cartItem.delete).mockResolvedValue(cartItemRecord);
  vi.mocked(prisma.cart.findFirst).mockResolvedValue(
    buildCartWithDeepItems({ id: CART_ID, tokenId: ANON_CART_TOKEN }),
  );
  vi.mocked(prisma.cart.update).mockImplementation(async ({ data }) => ({
    ...buildCartWithDeepItems({ id: CART_ID, tokenId: ANON_CART_TOKEN }),
    totalAmount: data.totalAmount as number,
  }));
});

describe('DELETE /api/cart/[id]', () => {
  describe('anonymous flow', () => {
    it('deletes the cart item by id and returns the updated cart', async () => {
      const response = await DELETE(
        request.delete(urls.cartItem(CART_ITEM_ID)).cartToken(ANON_CART_TOKEN).build(),
        params,
      );

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CART_ITEM_ID } }),
      );
    });
  });

  describe('authenticated flow', () => {
    it('deletes the cart item for an authenticated user', async () => {
      setSession(vi.mocked(getUserSession), mockRegularUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUserRecord({ id: REGULAR_USER_DB_ID }));
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(
        buildCartWithDeepItems({ id: CART_ID, userId: REGULAR_USER_DB_ID }),
      );

      const response = await DELETE(
        request.delete(urls.cartItem(CART_ITEM_ID)).build(),
        params,
      );

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CART_ITEM_ID } }),
      );
    });
  });

  describe('error cases', () => {
    it('returns an error body when there is no cart token and no session', async () => {
      const response = await DELETE(
        request.delete(urls.cartItem(CART_ITEM_ID)).build(),
        params,
      );

      const body = (await response.json()) as Record<string, string>;
      expect(body.error).toMatch(/cart token/i);
      expect(prisma.cartItem.delete).not.toHaveBeenCalled();
    });

    it('returns an error body when the cart item does not exist', async () => {
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);

      const response = await DELETE(
        request.delete(urls.cartItem(CART_ITEM_ID)).cartToken(ANON_CART_TOKEN).build(),
        params,
      );

      const body = (await response.json()) as Record<string, string>;
      expect(body.error).toMatch(/cart item not found/i);
      expect(prisma.cartItem.delete).not.toHaveBeenCalled();
    });

    it('returns 500 when the database throws', async () => {
      vi.mocked(prisma.cartItem.findFirst).mockRejectedValue(new Error('DB crash'));

      const response = await DELETE(
        request.delete(urls.cartItem(CART_ITEM_ID)).cartToken(ANON_CART_TOKEN).build(),
        params,
      );

      assertStatus(response, 500);
    });
  });
});
