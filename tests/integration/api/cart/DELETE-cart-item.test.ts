import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/cart/[id]/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertStatus, schemas } from '@/tests/helpers/response-validator';
import { clearSession, setSession } from '@/tests/helpers/auth-setup';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cartItem: { findFirst: vi.fn(), delete: vi.fn() },
    cart: { findFirst: vi.fn() },
    $executeRaw: vi.fn(),
  },
}));

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(), child: vi.fn() },
}));

const mockCartItem = { id: 1, cartId: 1, productItemId: 10, quantity: 2 };
const mockCart = {
  id: 1,
  totalAmount: 0,
  tokenId: 'test-token',
  userId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const params = { params: Promise.resolve({ id: '1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
  vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(mockCartItem as any);
  vi.mocked(prisma.cartItem.delete).mockResolvedValue(mockCartItem as any);
  vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
  vi.mocked(prisma.$executeRaw as any).mockResolvedValue(1);
});

describe('DELETE /api/cart/[id]', () => {
  it('deletes item and returns updated cart (anonymous)', async () => {
    const response = await DELETE(
      request.delete(urls.cartItem(1)).cartToken('test-token').build(),
      params,
    );

    await assertOkResponse(response, schemas.cart);
    expect(prisma.cartItem.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  it('deletes item for authenticated user', async () => {
    setSession(vi.mocked(getUserSession), { id: '2', email: 'user@test.com', role: 'USER' } as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 2 });
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({ ...mockCart, userId: 2 } as any);

    const response = await DELETE(
      request.delete(urls.cartItem(1)).build(),
      params,
    );

    await assertOkResponse(response, schemas.cart);
    expect(prisma.cartItem.delete).toHaveBeenCalled();
  });

  it('returns error body when no cartToken and unauthenticated', async () => {
    const response = await DELETE(
      request.delete(urls.cartItem(1)).build(),
      params,
    );

    const body = (await response.json()) as Record<string, string>;
    expect(body.error).toMatch(/cart token/i);
    expect(prisma.cartItem.delete).not.toHaveBeenCalled();
  });

  it('returns error body when cart item not found', async () => {
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);

    const response = await DELETE(
      request.delete(urls.cartItem(1)).cartToken('test-token').build(),
      params,
    );

    const body = (await response.json()) as Record<string, string>;
    expect(body.error).toMatch(/cart item not found/i);
    expect(prisma.cartItem.delete).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(prisma.cartItem.findFirst).mockRejectedValue(new Error('DB crash'));

    const response = await DELETE(
      request.delete(urls.cartItem(1)).cartToken('test-token').build(),
      params,
    );

    assertStatus(response, 500);
  });
});
