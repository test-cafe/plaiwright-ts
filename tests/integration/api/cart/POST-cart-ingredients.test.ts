import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/cart/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { clearSession } from '@/tests/helpers/auth-setup';
import {
  buildCartRecord,
  buildCartWithDeepItems,
  buildCartItemRecord,
  buildDeepCartItem,
} from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cart: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    cartItem: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn(),
}));

const CART_ID = 1;
const PRODUCT_ITEM_ID = 10;
const ANON_CART_TOKEN = 'test-token';

const CHEESE_ID = 2;
const MUSHROOMS_ID = 3;
const PEPPERS_ID = 4;
const CHEESE_PRICE = 50;
const MUSHROOMS_PRICE = 80;
const PEPPERS_PRICE = 60;
const PEPPERONI_PRICE = 549;

const PIZZA_SIZE_SMALL = 25;
const PIZZA_TYPE_TRADITIONAL = 1;

const baseCart = buildCartRecord({ id: CART_ID, tokenId: ANON_CART_TOKEN });

const postCart = (body: object) =>
  request.post(urls.cart()).json(body).cartToken(ANON_CART_TOKEN).build();

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
  vi.mocked(prisma.cart.update).mockImplementation(async ({ data }) => ({
    ...buildCartWithDeepItems({ id: CART_ID, tokenId: ANON_CART_TOKEN }),
    totalAmount: data.totalAmount as number,
  }));
});

describe('POST /api/cart — ingredient handling', () => {
  describe('creating new cart items', () => {
    it('connects a single ingredient to the new cart item', async () => {
      const cartWithItem = buildCartWithDeepItems({
        id: CART_ID,
        tokenId: ANON_CART_TOKEN,
        items: [
          buildDeepCartItem({
            cartId: CART_ID,
            productItemId: PRODUCT_ITEM_ID,
            ingredients: [
              { id: CHEESE_ID, name: 'Extra Cheese', price: CHEESE_PRICE, imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
            ],
          }),
        ],
      });

      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce(baseCart)
        .mockResolvedValueOnce(cartWithItem)
        .mockResolvedValueOnce(cartWithItem);
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.cartItem.create).mockResolvedValue(buildCartItemRecord({ cartId: CART_ID }));

      const response = await POST(
        postCart({
          productItemId: PRODUCT_ITEM_ID,
          quantity: 1,
          ingredientsIds: [CHEESE_ID],
          pizzaSize: PIZZA_SIZE_SMALL,
          type: PIZZA_TYPE_TRADITIONAL,
        }),
      );

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ingredients: { connect: [{ id: CHEESE_ID }] },
          }),
        }),
      );
    });

    it('connects multiple ingredients to the new cart item', async () => {
      const cartWithItem = buildCartWithDeepItems({
        id: CART_ID,
        tokenId: ANON_CART_TOKEN,
        items: [
          buildDeepCartItem({
            id: 2,
            cartId: CART_ID,
            productItemId: PRODUCT_ITEM_ID,
            ingredients: [
              { id: MUSHROOMS_ID, name: 'Mushrooms', price: MUSHROOMS_PRICE, imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
              { id: PEPPERS_ID, name: 'Peppers', price: PEPPERS_PRICE, imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
            ],
          }),
        ],
      });

      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce(baseCart)
        .mockResolvedValueOnce(cartWithItem)
        .mockResolvedValueOnce(cartWithItem);
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.cartItem.create).mockResolvedValue(buildCartItemRecord({ id: 2, cartId: CART_ID }));

      await POST(
        postCart({
          productItemId: PRODUCT_ITEM_ID,
          quantity: 1,
          ingredientsIds: [MUSHROOMS_ID, PEPPERS_ID],
        }),
      );

      expect(prisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ingredients: { connect: [{ id: MUSHROOMS_ID }, { id: PEPPERS_ID }] },
          }),
        }),
      );
    });

    it('creates the item without an ingredient connect when none are provided', async () => {
      const emptyCart = buildCartWithDeepItems({ id: CART_ID, tokenId: ANON_CART_TOKEN });

      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce(baseCart)
        .mockResolvedValueOnce(emptyCart)
        .mockResolvedValueOnce(emptyCart);
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.cartItem.create).mockResolvedValue(buildCartItemRecord({ id: 3, cartId: CART_ID }));

      const response = await POST(postCart({ productItemId: PRODUCT_ITEM_ID, quantity: 1 }));

      await assertOkResponse(response, schemas.cart);
      expect(prisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ productItemId: PRODUCT_ITEM_ID, quantity: 1 }),
        }),
      );
    });
  });

  describe('merging into existing cart items', () => {
    it('increments quantity when the same productItem+ingredients combo already exists', async () => {
      const existingItem = buildCartItemRecord({
        cartId: CART_ID,
        productItemId: PRODUCT_ITEM_ID,
        quantity: 2,
      });
      const cartAfterMerge = buildCartWithDeepItems({
        id: CART_ID,
        tokenId: ANON_CART_TOKEN,
        items: [
          buildDeepCartItem({
            cartId: CART_ID,
            productItemId: PRODUCT_ITEM_ID,
            quantity: 3,
            ingredients: [
              { id: CHEESE_ID, name: 'Extra Cheese', price: CHEESE_PRICE, imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
            ],
            productItem: {
              ...buildDeepCartItem().productItem,
              price: PEPPERONI_PRICE,
            },
          }),
        ],
      });

      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce(baseCart)
        .mockResolvedValueOnce(cartAfterMerge)
        .mockResolvedValueOnce(cartAfterMerge);
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([
        { ...existingItem, ingredients: [{ id: CHEESE_ID }] },
      ] as never);
      vi.mocked(prisma.cartItem.update).mockResolvedValue({ ...existingItem, quantity: 3 });

      await POST(
        postCart({ productItemId: PRODUCT_ITEM_ID, quantity: 1, ingredientsIds: [CHEESE_ID] }),
      );

      expect(prisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: existingItem.id }, data: { quantity: 3 } }),
      );
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe('response cookie', () => {
    it('sets the cartToken cookie on the response', async () => {
      const emptyCart = buildCartWithDeepItems({ id: CART_ID, tokenId: ANON_CART_TOKEN });

      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce(baseCart)
        .mockResolvedValueOnce(emptyCart)
        .mockResolvedValueOnce(emptyCart);
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.cartItem.create).mockResolvedValue(buildCartItemRecord({ id: 4, cartId: CART_ID }));

      const response = await POST(postCart({ productItemId: PRODUCT_ITEM_ID, quantity: 1 }));

      expect(response.headers.get('set-cookie')).toContain('cartToken');
    });
  });
});
