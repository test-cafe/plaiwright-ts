import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cart/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

const makeRequest = (cookieToken?: string, headerToken?: string) => {
  const headers = new Headers();
  if (headerToken) headers.set('x-cart-token', headerToken);
  if (cookieToken) headers.set('cookie', `cartToken=${cookieToken}`);
  return new NextRequest('http://localhost:3000/api/cart', { headers });
};

const mockCart = {
  id: 1,
  totalAmount: 699,
  tokenId: 'test-token',
  userId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(null);
});

describe('GET /api/cart', () => {
  it('returns cart by cookie cartToken for anonymous user', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

    const response = await GET(makeRequest('test-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tokenId: 'test-token' }),
      }),
    );
  });

  it('returns cart by x-cart-token header (mobile)', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

    const response = await GET(makeRequest(undefined, 'mobile-token'));
    expect(response.status).toBe(200);
  });

  it('returns cart by userId for authenticated user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '5', email: 'user@test.com' },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({ ...mockCart, userId: 5 } as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
  });

  it('returns empty items array when no cart found', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

    const response = await GET(makeRequest('unknown-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
  });
});
