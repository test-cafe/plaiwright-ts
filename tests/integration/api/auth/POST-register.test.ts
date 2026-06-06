import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, assertErrorResponse, schemas } from '@/tests/helpers/response-validator';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    verificationCode: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/send-email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('bcrypt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bcrypt')>();
  return { ...actual, hashSync: vi.fn(() => 'hashed-password') };
});

const validPayload = { email: 'new@test.com', password: 'ValidPass123!', fullName: 'New User' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.user.create).mockResolvedValue({
    id: 1,
    email: 'new@test.com',
    fullName: 'New User',
  } as any);
  vi.mocked(prisma.verificationCode.create).mockResolvedValue({} as any);
});

describe('POST /api/auth/register', () => {
  it('returns created user on success', async () => {
    const req = request.post(urls.authRegister()).json(validPayload).build();
    const response = await POST(req);

    await assertOkResponse(response, schemas.registerSuccess);
  });

  it('returns 409 when email is already in use', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 1 } as any);

    const req = request
      .post(urls.authRegister())
      .json({ email: 'existing@test.com', password: 'ValidPass123!', fullName: 'Existing' })
      .build();
    const response = await POST(req);

    await assertErrorResponse(response, 409, 'email already in use');
  });

  it('returns 400 when required fields are missing', async () => {
    const req = request.post(urls.authRegister()).json({ email: 'missing@test.com' }).build();
    const response = await POST(req);

    await assertErrorResponse(response, 400);
  });

  it('creates user with hashed password', async () => {
    const req = request.post(urls.authRegister()).json(validPayload).build();
    await POST(req);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed-password' }),
      }),
    );
  });
});
