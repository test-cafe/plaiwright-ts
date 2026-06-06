import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/cart/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { clearSession } from '@/tests/helpers/auth-setup';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cart: { findFirst: vi.fn() },
    cartItem: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn(),
}));

const TOKEN = 'test-token';

const mockCart = {
  id: 1,
  totalAmount: 0,
  tokenId: TOKEN,
  userId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeCartWithItems = (items: any[]) => ({
  ...mockCart,
  totalAmount: items.reduce(
    (sum, item) =>
      sum +
      (item.productItem.price +
        item.ingredients.reduce((s: number, i: any) => s + i.price, 0)) *
        item.quantity,
    0,
  ),
  items,
});

const postCart = (body: object) =>
  request.post(urls.cart()).json(body).cartToken(TOKEN).build();

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
  vi.mocked(prisma.$executeRaw as any).mockResolvedValue(1);
});

describe('POST /api/cart — ingredient handling', () => {
  it('creates a cart item with a single connected ingredient', async () => {
    const cartWithItem = makeCartWithItems([
      {
        id: 1,
        cartId: 1,
        productItemId: 10,
        quantity: 1,
        ingredients: [{ id: 2, price: 50, name: 'Extra Cheese' }],
        productItem: { price: 549, product: { id: 1, name: 'Pepperoni' } },
      },
    ]);

    vi.mocked(prisma.cart.findFirst as any)
      .mockResolvedValueOnce(mockCart)
      .mockResolvedValueOnce(cartWithItem)
      .mockResolvedValueOnce(cartWithItem);
    vi.mocked(prisma.cartItem.findFirst as any).mockResolvedValue(null);
    vi.mocked(prisma.cartItem.create as any).mockResolvedValue({ id: 1 });

    const response = await POST(
      postCart({ productItemId: 10, quantity: 1, ingredientsIds: [2], pizzaSize: 25, type: 1 }),
    );

    await assertOkResponse(response, schemas.cart);
    expect(prisma.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ingredients: { connect: [{ id: 2 }] },
        }),
      }),
    );
  });

  it('connects multiple ingredients to the cart item', async () => {
    const cartWithItem = makeCartWithItems([
      {
        id: 2,
        cartId: 1,
        productItemId: 10,
        quantity: 1,
        ingredients: [
          { id: 3, price: 80, name: 'Mushrooms' },
          { id: 4, price: 60, name: 'Peppers' },
        ],
        productItem: { price: 599, product: { id: 1, name: 'Margherita' } },
      },
    ]);

    vi.mocked(prisma.cart.findFirst as any)
      .mockResolvedValueOnce(mockCart)
      .mockResolvedValueOnce(cartWithItem)
      .mockResolvedValueOnce(cartWithItem);
    vi.mocked(prisma.cartItem.findFirst as any).mockResolvedValue(null);
    vi.mocked(prisma.cartItem.create as any).mockResolvedValue({ id: 2 });

    await POST(postCart({ productItemId: 10, quantity: 1, ingredientsIds: [3, 4] }));

    expect(prisma.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ingredients: { connect: [{ id: 3 }, { id: 4 }] },
        }),
      }),
    );
  });

  it('increments quantity when same productItemId+ingredients combination already in cart', async () => {
    const existingItem = {
      id: 1,
      cartId: 1,
      productItemId: 10,
      quantity: 2,
      ingredients: [{ id: 2, price: 50, name: 'Extra Cheese' }],
      productItem: { price: 549, product: { id: 1, name: 'Pepperoni' } },
    };

    vi.mocked(prisma.cart.findFirst as any)
      .mockResolvedValueOnce(mockCart)
      .mockResolvedValueOnce(makeCartWithItems([{ ...existingItem, quantity: 3 }]))
      .mockResolvedValueOnce(makeCartWithItems([{ ...existingItem, quantity: 3 }]));
    vi.mocked(prisma.cartItem.findFirst as any).mockResolvedValue(existingItem);
    vi.mocked(prisma.cartItem.update as any).mockResolvedValue({ ...existingItem, quantity: 3 });

    await POST(postCart({ productItemId: 10, quantity: 1, ingredientsIds: [2] }));

    expect(prisma.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { quantity: 3 } }),
    );
    expect(prisma.cartItem.create).not.toHaveBeenCalled();
  });

  it('creates a separate item when no ingredients provided', async () => {
    const emptyCart = makeCartWithItems([]);

    vi.mocked(prisma.cart.findFirst as any)
      .mockResolvedValueOnce(mockCart)
      .mockResolvedValueOnce(emptyCart)
      .mockResolvedValueOnce(emptyCart);
    vi.mocked(prisma.cartItem.findFirst as any).mockResolvedValue(null);
    vi.mocked(prisma.cartItem.create as any).mockResolvedValue({ id: 3 });

    const response = await POST(postCart({ productItemId: 10, quantity: 1 }));

    await assertOkResponse(response, schemas.cart);
    expect(prisma.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ productItemId: 10, quantity: 1 }),
      }),
    );
  });

  it('sets cartToken cookie on the response', async () => {
    const emptyCart = makeCartWithItems([]);

    vi.mocked(prisma.cart.findFirst as any)
      .mockResolvedValueOnce(mockCart)
      .mockResolvedValueOnce(emptyCart)
      .mockResolvedValueOnce(emptyCart);
    vi.mocked(prisma.cartItem.findFirst as any).mockResolvedValue(null);
    vi.mocked(prisma.cartItem.create as any).mockResolvedValue({ id: 4 });

    const response = await POST(postCart({ productItemId: 10, quantity: 1 }));

    expect(response.headers.get('set-cookie')).toContain('cartToken');
  });
});
