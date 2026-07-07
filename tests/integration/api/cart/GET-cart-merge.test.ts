import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';
import { GET } from '@/app/api/cart/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { setSession, clearSession, mockRegularUser } from '@/tests/helpers/auth-setup';
import {
  buildCartWithDeepItems,
  buildDeepCartItem,
  buildUserRecord,
} from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cart: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn(),
}));

const REGULAR_USER_DB_ID = Number(mockRegularUser.id);
const NEW_USER_DB_ID = 9;
const ANON_CART_ID = 1;
const ANON_CART_TOKEN = 'anon-token-123';
const STALE_CART_TOKEN = 'stale-token';
const PRODUCT_ITEM_ID = 5;
const PRODUCT_ITEM_PRICE = 449;
const CART_QUANTITY = 2;
const CART_TOTAL = 899;

const newUser: Session['user'] = { ...mockRegularUser, id: String(NEW_USER_DB_ID) };

const anonymousCart = buildCartWithDeepItems({
  id: ANON_CART_ID,
  totalAmount: CART_TOTAL,
  tokenId: ANON_CART_TOKEN,
  items: [
    buildDeepCartItem({
      cartId: ANON_CART_ID,
      productItemId: PRODUCT_ITEM_ID,
      quantity: CART_QUANTITY,
      productItem: {
        ...buildDeepCartItem().productItem,
        id: PRODUCT_ITEM_ID,
        price: PRODUCT_ITEM_PRICE,
        product: { ...buildDeepCartItem().productItem.product, name: 'Margherita' },
      },
    }),
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
});

describe('GET /api/cart — post-login cart access', () => {
  describe('cart lookup query', () => {
    it('queries by userId only when authenticated, ignoring any stale cartToken cookie', async () => {
      setSession(vi.mocked(getUserSession), mockRegularUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUserRecord({ id: REGULAR_USER_DB_ID }));
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(anonymousCart);

      const response = await GET(request.get(urls.cart()).cartToken(ANON_CART_TOKEN).build());
      await assertOkResponse(response, schemas.cart);

      expect(prisma.cart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: REGULAR_USER_DB_ID },
        }),
      );
    });

    it('queries by userId only when no cartToken cookie is present', async () => {
      setSession(vi.mocked(getUserSession), mockRegularUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUserRecord({ id: REGULAR_USER_DB_ID }));
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

      const response = await GET(request.get(urls.cart()).build());
      const body = await assertOkResponse(response, schemas.cart);

      expect(body.items).toEqual([]);
      expect(prisma.cart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: REGULAR_USER_DB_ID },
        }),
      );
    });
  });

  describe('empty results', () => {
    it('returns empty items when no cart matches either userId or tokenId', async () => {
      setSession(vi.mocked(getUserSession), newUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUserRecord({ id: NEW_USER_DB_ID }));
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

      const response = await GET(request.get(urls.cart()).cartToken(STALE_CART_TOKEN).build());
      const body = await assertOkResponse(response, schemas.cart);

      expect(body.items).toEqual([]);
    });
  });
});
