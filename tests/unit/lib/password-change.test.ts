import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSession } from '@/lib/get-user-session';
import { prisma } from '@/lib/prisma';
import { updateUserInfo } from '@/app/actions';
import { authOptions } from '@/lib/auth-options';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { User } from '@prisma/client';

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

const USER_ID = '1';
const USER_EMAIL = 'user@test.com';
const USER_NAME = 'Test User';

const MOCK_SESSION_USER: Session['user'] = {
  id: USER_ID,
  role: 'USER',
  name: USER_NAME,
  image: '',
};

const jwtCallback = authOptions.callbacks!.jwt as (args: { token: JWT }) => Promise<JWT>;

describe('updateUserInfo — password change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserSession).mockResolvedValue(MOCK_SESSION_USER);
    vi.mocked(prisma.user.update).mockResolvedValue({} as unknown as User);
  });

  it('hashes the new password with bcrypt before storing', async () => {
    await updateUserInfo({ email: USER_EMAIL, password: 'newSecret123', fullName: USER_NAME });

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
      email: USER_EMAIL,
      fullName: USER_NAME,
      role: 'USER',
    } as unknown as User);

    const token = await jwtCallback({ token: { email: USER_EMAIL, id: USER_ID } as unknown as JWT });

    expect(token.id).toBe(USER_ID);
    expect(token.email).toBe(USER_EMAIL);
    expect(token.role).toBe('USER');
  });

  it('returns bare token when no matching user found (e.g. deleted account)', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const token = await jwtCallback({ token: { email: 'ghost@test.com' } as unknown as JWT });

    expect(token.id).toBeUndefined();
  });
});
