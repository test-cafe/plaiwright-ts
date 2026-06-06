import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/cart/route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/get-user-session';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertStatus, schemas } from '@/tests/helpers/response-validator';
import { clearSession, setSession } from '@/tests/helpers/auth-setup';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
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

const mockCart = {
  id: 1,
  totalAmount: 0,
  tokenId: 'test-token',
  userId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  clearSession(vi.mocked(getUserSession));
  vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
  vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 2 });
  vi.mocked(prisma.$executeRaw as any).mockResolvedValue(1);
});

describe('DELETE /api/cart', () => {
  it('clears all items and returns empty cart (anonymous)', async () => {
    const response = await DELETE(request.delete(urls.cart()).cartToken('test-token').build());

    await assertOkResponse(response, schemas.cart);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cartId: mockCart.id } }),
    );
  });

  it('clears all items for authenticated user', async () => {
    setSession(vi.mocked(getUserSession), { id: '2', email: 'user@test.com', role: 'USER' } as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 2 });
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({ ...mockCart, userId: 2 } as any);

    const response = await DELETE(request.delete(urls.cart()).build());

    await assertOkResponse(response, schemas.cart);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalled();
  });

  it('returns 400 when no cartToken and unauthenticated', async () => {
    const response = await DELETE(request.delete(urls.cart()).build());

    assertStatus(response, 400);
    expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it('returns 404 when cart not found', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

    const response = await DELETE(request.delete(urls.cart()).cartToken('ghost-token').build());

    assertStatus(response, 404);
    expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(prisma.cart.findFirst).mockRejectedValue(new Error('DB crash'));

    const response = await DELETE(request.delete(urls.cart()).cartToken('test-token').build());

    assertStatus(response, 500);
  });
});
