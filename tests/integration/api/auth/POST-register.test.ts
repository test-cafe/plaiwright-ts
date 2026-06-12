import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertErrorResponse, schemas } from '@/tests/helpers/response-validator';
import { buildUserRecord } from '@/tests/fixtures/mock-prisma-records';

const { HASHED_PASSWORD } = vi.hoisted(() => ({ HASHED_PASSWORD: 'hashed-password' }));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bcrypt')>();
  return { ...actual, hashSync: vi.fn(() => HASHED_PASSWORD) };
});

const NEW_USER_ID = 1;
const NEW_USER_EMAIL = 'new@test.com';
const NEW_USER_NAME = 'New User';
const VALID_PASSWORD = 'ValidPass123!';
const EXISTING_EMAIL = 'existing@test.com';

const validPayload = { email: NEW_USER_EMAIL, password: VALID_PASSWORD, fullName: NEW_USER_NAME };

const postRegister = (body: unknown): NextRequest =>
  request.post(urls.authRegister()).json(body).build();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.user.create).mockResolvedValue(
    buildUserRecord({ id: NEW_USER_ID, email: NEW_USER_EMAIL, fullName: NEW_USER_NAME }),
  );
});

describe('POST /api/auth/register', () => {
  describe('successful registration', () => {
    it('returns the created user', async () => {
      const response = await POST(postRegister(validPayload));

      await assertOkResponse(response, schemas.registerSuccess);
    });

    it('hashes the password before storing', async () => {
      await POST(postRegister(validPayload));

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: HASHED_PASSWORD }),
        }),
      );
    });
  });

  describe('failure cases', () => {
    it('returns 409 when email is already in use', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(
        buildUserRecord({ email: EXISTING_EMAIL }),
      );

      const response = await POST(
        postRegister({ email: EXISTING_EMAIL, password: VALID_PASSWORD, fullName: 'Existing' }),
      );

      await assertErrorResponse(response, 409, 'email already in use');
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await POST(postRegister({ email: NEW_USER_EMAIL }));

      await assertErrorResponse(response, 400);
    });
  });
});
