import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/verify/route';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertErrorResponse } from '@/tests/helpers/response-validator';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    verificationCode: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

const validCode = {
  id: 99,
  code: 'abc123',
  userId: 7,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 60_000),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(null);
  vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(validCode as any);
  vi.mocked(prisma.user.update).mockResolvedValue({} as any);
  vi.mocked(prisma.verificationCode.delete).mockResolvedValue({} as any);
});

describe('GET /api/auth/verify', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    const rateLimitResponse = new Response(JSON.stringify({ message: 'Too many requests. Please try again later.' }), {
      status: 429,
    });
    vi.mocked(rateLimit).mockReturnValue(rateLimitResponse as any);

    const req = request.get(urls.authVerify('abc123')).build();
    const response = await GET(req);

    expect(response.status).toBe(429);
  });

  it('returns 400 when code query param is missing', async () => {
    const req = request.get(urls.authVerify('')).build();
    const response = await GET(req);

    await assertErrorResponse(response, 400, 'Code is required');
  });

  it('returns 400 when code does not exist in the database', async () => {
    vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

    const req = request.get(urls.authVerify('invalid-code')).build();
    const response = await GET(req);

    await assertErrorResponse(response, 400, 'Invalid code');
  });

  it('returns 400 when code is expired', async () => {
    vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue({
      ...validCode,
      expiresAt: new Date(Date.now() - 1000),
    } as any);

    const req = request.get(urls.authVerify('abc123')).build();
    const response = await GET(req);

    await assertErrorResponse(response, 400, 'Code expired');
  });

  it('redirects to /?verified on success', async () => {
    const req = request.get(urls.authVerify('abc123')).build();
    const response = await GET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toMatch(/\?verified/);
  });

  it('updates the user verified field on success', async () => {
    const req = request.get(urls.authVerify('abc123')).build();
    await GET(req);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: validCode.userId },
        data: expect.objectContaining({ verified: expect.any(Date) }),
      }),
    );
  });

  it('deletes the verification code after successful verification', async () => {
    const req = request.get(urls.authVerify('abc123')).build();
    await GET(req);

    expect(prisma.verificationCode.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: validCode.id } }),
    );
  });

  it('looks up the code by its value', async () => {
    const req = request.get(urls.authVerify('abc123')).build();
    await GET(req);

    expect(prisma.verificationCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'abc123' } }),
    );
  });
});
