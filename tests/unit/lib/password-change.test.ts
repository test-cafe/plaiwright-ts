import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSession } from '@/lib/get-user-session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/get-user-session');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('bcrypt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bcrypt')>();
  return { ...actual, hashSync: vi.fn(() => 'hashed-new-password') };
});
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn(() => undefined) })),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/create-payment', () => ({ createPayment: vi.fn() }));
vi.mock('@/lib/send-email', () => ({ sendEmail: vi.fn() }));

import { updateUserInfo } from '@/app/actions';
import { authOptions } from '@/lib/auth-options';

const jwtCallback = authOptions.callbacks!.jwt as (args: any) => Promise<any>;

describe('updateUserInfo — password change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserSession).mockResolvedValue({
      id: '1',
      email: 'user@test.com',
      role: 'USER',
      name: 'Test User',
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
  });

  it('hashes the new password with bcrypt before storing', async () => {
    await updateUserInfo({ email: 'user@test.com', password: 'newSecret123', fullName: 'Test User' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ password: 'hashed-new-password' }),
      }),
    );
  });

  it('stores updated email and fullName alongside the new password hash', async () => {
    await updateUserInfo({ email: 'new@test.com', password: 'pass', fullName: 'New Name' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@test.com',
          fullName: 'New Name',
          password: 'hashed-new-password',
        }),
      }),
    );
  });

  it('throws when no active session exists', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    await expect(
      updateUserInfo({ email: 'x@test.com', password: 'p', fullName: 'X' }),
    ).rejects.toThrow('User not found');
  });
});

describe('jwt callback — session behaviour after password change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-fetches user from DB by email so the token stays enriched after password change', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 1,
      email: 'user@test.com',
      fullName: 'Test User',
      role: 'USER',
    } as any);

    const token = await jwtCallback({ token: { email: 'user@test.com', id: '1' } });

    expect(token.id).toBe('1');
    expect(token.email).toBe('user@test.com');
    expect(token.role).toBe('USER');
    // JWT is not invalidated on password change — the callback looks up user by email, not password
  });

  it('returns bare token when no matching user found (e.g. deleted account)', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const token = await jwtCallback({ token: { email: 'ghost@test.com' } });

    expect(token.id).toBeUndefined();
  });
});
