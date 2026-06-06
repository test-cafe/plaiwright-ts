import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createUserFactory } from '@/tests/fixtures/db/users';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(() => ({ get: vi.fn(() => undefined) })) }));
vi.mock('@/lib/send-email', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/create-payment', () => ({ createPayment: vi.fn() }));
vi.mock('@/lib/get-user-session');
vi.mock('bcrypt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bcrypt')>();
  return { ...actual, hashSync: vi.fn(() => 'hashed-password') };
});

import { requestPasswordReset, resetPassword } from '@/app/actions';
import { sendEmail } from '@/lib/send-email';

const prisma = useTestDb();
const userFactory = createUserFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
  vi.clearAllMocks();
});

describe('requestPasswordReset', () => {
  it('is a no-op for an unknown email — does not reveal existence', async () => {
    await requestPasswordReset('ghost@test.com');

    expect(sendEmail).not.toHaveBeenCalled();
    const token = await prisma.passwordResetToken.findFirst();
    expect(token).toBeNull();
  });

  it('creates a reset token with 30-minute expiry for a known user', async () => {
    const user = await userFactory.build({ email: 'real@test.com' });

    await requestPasswordReset('real@test.com');

    const token = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
    expect(token).not.toBeNull();
    expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(token?.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 31 * 60 * 1000);
  });

  it('sends a reset email to the user', async () => {
    await userFactory.build({ email: 'notify@test.com' });

    await requestPasswordReset('notify@test.com');

    expect(sendEmail).toHaveBeenCalledWith(
      'notify@test.com',
      expect.stringContaining('password'),
      expect.stringContaining('reset'),
    );
  });

  it('upserts the token if one already exists — only one token per user', async () => {
    const user = await userFactory.build({ email: 'repeat@test.com' });

    await requestPasswordReset('repeat@test.com');
    await requestPasswordReset('repeat@test.com');

    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
    expect(tokens).toHaveLength(1);
  });
});

describe('resetPassword', () => {
  it('throws for an invalid token', async () => {
    await expect(resetPassword('bad-token', 'newpass')).rejects.toThrow(
      'Invalid or expired reset link',
    );
  });

  it('throws and cleans up the token when it has expired', async () => {
    const user = await userFactory.build();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    await expect(resetPassword('expired-token', 'newpass')).rejects.toThrow(
      'Reset link has expired',
    );

    const found = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
    expect(found).toBeNull();
  });

  it('updates password hash and deletes token on success', async () => {
    const user = await userFactory.build();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    await resetPassword('valid-token', 'newpassword');

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.password).toBe('hashed-password');

    const tokenAfter = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
    expect(tokenAfter).toBeNull();
  });

  it('does not affect other users when resetting one user password', async () => {
    const userA = await userFactory.build();
    const userB = await userFactory.build();
    const originalPasswordB = userB.password;

    await prisma.passwordResetToken.create({
      data: {
        userId: userA.id,
        token: 'token-for-a',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    await resetPassword('token-for-a', 'newpassword');

    const b = await prisma.user.findUnique({ where: { id: userB.id } });
    expect(b?.password).toBe(originalPasswordB);
  });
});
