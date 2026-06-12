import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';
import { UserRole } from '@prisma/client';
import { GET } from '@/app/api/auth/me/route';
import { getUserSession } from '@/lib/get-user-session';
import { prisma } from '@/lib/prisma';
import { assertOkResponse, assertErrorResponse, schemas } from '@/tests/helpers/response-validator';
import { setSession } from '@/tests/helpers/auth-setup';
import { buildUserRecord } from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/get-user-session');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  },
}));

const USER_ID = 1;
const USER_NAME = 'Alice';
const USER_EMAIL = 'alice@test.com';
const OTHER_USER_ID = 42;

const buildSession = (overrides: Partial<Session['user']> = {}): Session['user'] => ({
  id: String(USER_ID),
  name: USER_NAME,
  image: '',
  role: UserRole.USER,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/auth/me', () => {
  describe('unauthenticated requests', () => {
    it('returns 401 when there is no session', async () => {
      vi.mocked(getUserSession).mockResolvedValue(null);

      const response = await GET();

      await assertErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('authenticated requests', () => {
    beforeEach(() => {
      setSession(vi.mocked(getUserSession), buildSession());
      vi.mocked(prisma.user.findUnique).mockResolvedValue(
        buildUserRecord({ id: USER_ID, fullName: USER_NAME, email: USER_EMAIL }),
      );
    });

    it('returns the user fullName and email', async () => {
      const response = await GET();

      const body = await assertOkResponse(response, schemas.me);
      expect(body).toEqual({ fullName: USER_NAME, email: USER_EMAIL });
    });

    it('excludes the password field from the database query', async () => {
      await GET();

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({ password: false }),
        }),
      );
    });

    it('queries by the numeric user id from the session', async () => {
      setSession(vi.mocked(getUserSession), buildSession({ id: String(OTHER_USER_ID) }));

      await GET();

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: OTHER_USER_ID } }),
      );
    });
  });
});
