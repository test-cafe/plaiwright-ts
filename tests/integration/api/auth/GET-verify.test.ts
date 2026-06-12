import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/verify/route';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertErrorResponse } from '@/tests/helpers/response-validator';
import {
  buildUserRecord,
  buildVerificationCodeRecord,
} from '@/tests/fixtures/mock-prisma-records';

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

const CODE_ID = 99;
const CODE_VALUE = 'abc123';
const INVALID_CODE = 'invalid-code';
const USER_ID = 7;
const EXPIRY_MS = 60_000;

const validCode = buildVerificationCodeRecord({
  id: CODE_ID,
  code: CODE_VALUE,
  userId: USER_ID,
  expiresAt: new Date(Date.now() + EXPIRY_MS),
});

const getVerify = (code: string): NextRequest =>
  request.get(urls.authVerify(code)).build();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(null);
  vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(validCode);
  vi.mocked(prisma.user.update).mockResolvedValue(buildUserRecord({ id: USER_ID }));
  vi.mocked(prisma.verificationCode.delete).mockResolvedValue(validCode);
});

describe('GET /api/auth/verify', () => {
  describe('rate limiting', () => {
    it('returns 429 when the limiter blocks the request', async () => {
      vi.mocked(rateLimit).mockReturnValue(
        NextResponse.json(
          { message: 'Too many requests. Please try again later.' },
          { status: 429 },
        ),
      );

      const response = await GET(getVerify(CODE_VALUE));

      expect(response.status).toBe(429);
    });
  });

  describe('input validation', () => {
    it('returns 400 when the code query param is missing', async () => {
      const response = await GET(getVerify(''));

      await assertErrorResponse(response, 400, 'Code is required');
    });
  });

  describe('code validation', () => {
    it('returns 400 when no matching code exists in the database', async () => {
      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

      const response = await GET(getVerify(INVALID_CODE));

      await assertErrorResponse(response, 400, 'Invalid code');
    });

    it('returns 400 when the code has expired', async () => {
      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(
        buildVerificationCodeRecord({
          id: CODE_ID,
          code: CODE_VALUE,
          userId: USER_ID,
          expiresAt: new Date(Date.now() - 1000),
        }),
      );

      const response = await GET(getVerify(CODE_VALUE));

      await assertErrorResponse(response, 400, 'Code expired');
    });

    it('looks up the code by its value', async () => {
      await GET(getVerify(CODE_VALUE));

      expect(prisma.verificationCode.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: CODE_VALUE } }),
      );
    });
  });

  describe('successful verification', () => {
    it('redirects to /?verified', async () => {
      const response = await GET(getVerify(CODE_VALUE));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toMatch(/\?verified/);
    });

    it('marks the user as verified', async () => {
      await GET(getVerify(CODE_VALUE));

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: expect.objectContaining({ verified: expect.any(Date) }),
        }),
      );
    });

    it('deletes the verification code after marking the user verified', async () => {
      await GET(getVerify(CODE_VALUE));

      expect(prisma.verificationCode.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CODE_ID } }),
      );
    });
  });
});
