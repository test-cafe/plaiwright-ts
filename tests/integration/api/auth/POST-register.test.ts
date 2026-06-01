import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

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

const makeRequest = (body: object) =>
  new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.user.create).mockResolvedValue({ id: 1, email: 'new@test.com' } as any);
  vi.mocked(prisma.verificationCode.create).mockResolvedValue({} as any);
});

describe('POST /api/auth/register', () => {
  it('returns success for valid new user', async () => {
    const response = await POST(
      makeRequest({ email: 'new@test.com', password: 'ValidPass123!', fullName: 'New User' }),
    );
    expect(response.status).toBe(200);
  });

  it('returns 400 when user already exists', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 1 } as any);

    const response = await POST(
      makeRequest({ email: 'existing@test.com', password: 'ValidPass123!', fullName: 'Existing' }),
    );

    expect(response.status).toBe(400);
  });

  it('creates user with hashed password', async () => {
    await POST(
      makeRequest({ email: 'hash@test.com', password: 'ValidPass123!', fullName: 'Hash Test' }),
    );

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed-password' }),
      }),
    );
  });
});
