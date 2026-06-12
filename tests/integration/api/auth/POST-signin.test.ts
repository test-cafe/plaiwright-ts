import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/signin/route';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertErrorResponse, schemas } from '@/tests/helpers/response-validator';
import { buildUserRecord } from '@/tests/fixtures/mock-prisma-records';

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

// bcrypt's `compare` has callback + promise overloads; narrow to the promise overload for mocking.
type AsyncCompare = (data: string | Buffer, hash: string) => Promise<boolean>;
const mockCompare = vi.mocked(compare as AsyncCompare);

const USER_ID = 1;
const USER_EMAIL = 'alice@test.com';
const USER_NAME = 'Alice';
const HASHED_PASSWORD = 'hashed';
const VALID_PASSWORD = 'correct';
const WRONG_PASSWORD = 'wrong';
const UNKNOWN_EMAIL = 'unknown@test.com';

const userRecord = buildUserRecord({
  id: USER_ID,
  email: USER_EMAIL,
  fullName: USER_NAME,
  password: HASHED_PASSWORD,
});

const postSignin = (body: unknown): NextRequest =>
  request.post(urls.authSignin()).json(body).build();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(null);
  vi.mocked(prisma.user.findFirst).mockResolvedValue(userRecord);
  mockCompare.mockResolvedValue(true);
});

describe('POST /api/auth/signin', () => {
  describe('rate limiting', () => {
    it('returns 429 when the limiter blocks the request', async () => {
      vi.mocked(rateLimit).mockReturnValue(
        NextResponse.json(
          { message: 'Too many requests. Please try again later.' },
          { status: 429 },
        ),
      );

      const response = await POST(postSignin({ email: USER_EMAIL, password: VALID_PASSWORD }));

      expect(response.status).toBe(429);
    });
  });

  describe('input validation', () => {
    it('returns 400 when email is missing', async () => {
      const response = await POST(postSignin({ password: VALID_PASSWORD }));

      await assertErrorResponse(response, 400);
    });

    it('returns 400 when password is missing', async () => {
      const response = await POST(postSignin({ email: USER_EMAIL }));

      await assertErrorResponse(response, 400);
    });
  });

  describe('credential validation', () => {
    it('returns 401 when no user matches the email', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const response = await POST(
        postSignin({ email: UNKNOWN_EMAIL, password: VALID_PASSWORD }),
      );

      await assertErrorResponse(response, 401, 'Invalid credentials');
    });

    it('returns 401 when the password does not match', async () => {
      mockCompare.mockResolvedValue(false);

      const response = await POST(postSignin({ email: USER_EMAIL, password: WRONG_PASSWORD }));

      await assertErrorResponse(response, 401, 'Invalid credentials');
    });
  });

  describe('successful sign-in', () => {
    it('returns the user id, fullName, and email', async () => {
      const response = await POST(postSignin({ email: USER_EMAIL, password: VALID_PASSWORD }));

      const body = await assertOkResponse(response, schemas.signinSuccess);
      expect(body.user).toEqual({ id: USER_ID, fullName: USER_NAME, email: USER_EMAIL });
    });

    it('does not expose the password in the response', async () => {
      const response = await POST(postSignin({ email: USER_EMAIL, password: VALID_PASSWORD }));

      const body = (await response.json()) as { user: Record<string, unknown> };
      expect(body.user).not.toHaveProperty('password');
    });

    it('looks up the user by email', async () => {
      await POST(postSignin({ email: USER_EMAIL, password: VALID_PASSWORD }));

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: USER_EMAIL } }),
      );
    });
  });
});
