import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cart/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    cart: { findFirst: vi.fn() },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

const makeRequest = (cookieToken?: string) => {
  const headers = new Headers();
  if (cookieToken) headers.set('cookie', `cartToken=${cookieToken}`);
  return new NextRequest('http://localhost:3000/api/cart', { headers });
};

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
});

describe('GET /api/cart — post-login cart access', () => {
  it('logged-in user can access their anonymous cart via tokenId cookie (OR query)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '5', email: 'user@test.com', role: 'USER' },
    } as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 5 });
    vi.mocked(prisma.cart.findFirst as any).mockResolvedValue(mockAnonymousCart);

    const response = await GET(makeRequest('anon-token-123'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    // Both userId and tokenId are included in the OR query so the anonymous cart is reachable
    expect(prisma.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { userId: 5 },
            { tokenId: 'anon-token-123' },
          ]),
        }),
      }),
    );
  });

  it('authenticated user without a cartToken cookie queries by userId only', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '5', email: 'user@test.com', role: 'USER' },
    } as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 5 });
    vi.mocked(prisma.cart.findFirst as any).mockResolvedValue(null);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
    expect(prisma.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ userId: 5 }],
        }),
      }),
    );
  });

  it('returns empty items when no cart exists for either userId or tokenId', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '9', email: 'new@test.com', role: 'USER' },
    } as any);
    vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: 9 });
    vi.mocked(prisma.cart.findFirst as any).mockResolvedValue(null);

    const response = await GET(makeRequest('stale-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
  });
});
