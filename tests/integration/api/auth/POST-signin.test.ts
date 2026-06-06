import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/signin/route';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertErrorResponse } from '@/tests/helpers/response-validator';
import { z } from 'zod';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';

const signinSuccessSchema = z.object({
  user: z.object({
    id: z.number(),
    fullName: z.string(),
    email: z.string().email(),
  }),
});

const fakeUser = {
  id: 1,
  fullName: 'Alice',
  email: 'alice@test.com',
  password: 'hashed',
  verified: new Date(),
  role: 'USER',
  provider: 'credentials',
  providerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(null);
  vi.mocked(prisma.user.findFirst).mockResolvedValue(fakeUser as any);
  vi.mocked(compare).mockResolvedValue(true as never);
});

describe('POST /api/auth/signin', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    const rateLimitResponse = new Response(JSON.stringify({ message: 'Too many requests. Please try again later.' }), {
      status: 429,
    });
    vi.mocked(rateLimit).mockReturnValue(rateLimitResponse as any);

    const req = request.post(urls.authSignin()).json({ email: 'alice@test.com', password: 'pass' }).build();
    const response = await POST(req);

    expect(response.status).toBe(429);
  });

  it('returns 400 when email is missing', async () => {
    const req = request.post(urls.authSignin()).json({ password: 'pass' }).build();
    const response = await POST(req);

    await assertErrorResponse(response, 400);
  });

  it('returns 400 when password is missing', async () => {
    const req = request.post(urls.authSignin()).json({ email: 'alice@test.com' }).build();
    const response = await POST(req);

    await assertErrorResponse(response, 400);
  });

  it('returns 401 when user does not exist', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const req = request.post(urls.authSignin()).json({ email: 'unknown@test.com', password: 'pass' }).build();
    const response = await POST(req);

    await assertErrorResponse(response, 401, 'Invalid credentials');
  });

  it('returns 401 when password is wrong', async () => {
    vi.mocked(compare).mockResolvedValue(false as never);

    const req = request.post(urls.authSignin()).json({ email: 'alice@test.com', password: 'wrong' }).build();
    const response = await POST(req);

    await assertErrorResponse(response, 401, 'Invalid credentials');
  });

  it('returns user id, fullName, and email on success', async () => {
    const req = request.post(urls.authSignin()).json({ email: 'alice@test.com', password: 'correct' }).build();
    const response = await POST(req);

    const body = await assertOkResponse(response, signinSuccessSchema);
    expect(body.user.fullName).toBe('Alice');
    expect(body.user.email).toBe('alice@test.com');
  });

  it('does not expose password in the success response', async () => {
    const req = request.post(urls.authSignin()).json({ email: 'alice@test.com', password: 'correct' }).build();
    const response = await POST(req);

    const body = await response.json();
    expect(body.user).not.toHaveProperty('password');
  });

  it('looks up the user by email', async () => {
    const req = request.post(urls.authSignin()).json({ email: 'alice@test.com', password: 'correct' }).build();
    await POST(req);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'alice@test.com' } }),
    );
  });
});
