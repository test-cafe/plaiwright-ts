import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/me/route';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertErrorResponse } from '@/tests/helpers/response-validator';
import { z } from 'zod';

vi.mock('@/lib/get-user-session');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(), child: vi.fn() },
}));

import { getUserSession } from '@/lib/get-user-session';
import { prisma } from '@/lib/prisma';

const meSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/auth/me', () => {
  it('returns 401 when no session', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    const response = await GET();

    await assertErrorResponse(response, 401, 'Unauthorized');
  });

  it('returns user fullName and email when authenticated', async () => {
    vi.mocked(getUserSession).mockResolvedValue({ id: '1', name: 'Alice', email: 'alice@test.com' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      fullName: 'Alice',
      email: 'alice@test.com',
    } as any);

    const response = await GET();

    const body = await assertOkResponse(response, meSchema);
    expect(body.fullName).toBe('Alice');
    expect(body.email).toBe('alice@test.com');
  });

  it('does not expose password in the response', async () => {
    vi.mocked(getUserSession).mockResolvedValue({ id: '2', name: 'Bob', email: 'bob@test.com' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      fullName: 'Bob',
      email: 'bob@test.com',
    } as any);

    const response = await GET();
    const body = await response.json();

    expect(body).not.toHaveProperty('password');
  });

  it('queries by the numeric user id from the session', async () => {
    vi.mocked(getUserSession).mockResolvedValue({ id: '42', name: 'Carol', email: 'carol@test.com' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ fullName: 'Carol', email: 'carol@test.com' } as any);

    await GET();

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
  });
});
