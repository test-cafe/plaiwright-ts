import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createUserFactory } from '@/tests/fixtures/db/users';

const prisma = useTestDb();
const userFactory = createUserFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
});

describe('VerificationCode', () => {
  it('creates with future expiresAt', async () => {
    const user = await userFactory.buildUnverified();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const code = await prisma.verificationCode.create({
      data: { userId: user.id, code: '123456', expiresAt },
    });

    expect(code.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('is rejected when expiresAt is in the past', async () => {
    const user = await userFactory.buildUnverified();
    const expiredAt = new Date(Date.now() - 1000);

    await prisma.verificationCode.create({
      data: { userId: user.id, code: '999999', expiresAt: expiredAt },
    });

    const code = await prisma.verificationCode.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
    });

    expect(code).toBeNull();
  });

  it('cascades delete with user', async () => {
    const user = await userFactory.buildUnverified();
    await prisma.verificationCode.create({
      data: { userId: user.id, code: '111111', expiresAt: new Date(Date.now() + 3600000) },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const code = await prisma.verificationCode.findFirst({ where: { userId: user.id } });
    expect(code).toBeNull();
  });
});

describe('PasswordResetToken', () => {
  it('creates with unique token and future expiry', async () => {
    const user = await userFactory.build();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const token = await prisma.passwordResetToken.create({
      data: { userId: user.id, token: 'unique-reset-token-abc', expiresAt },
    });

    expect(token.token).toBe('unique-reset-token-abc');
    expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('cannot create two reset tokens for the same user (unique constraint)', async () => {
    const user = await userFactory.build();
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: 'first-token', expiresAt },
    });

    await expect(
      prisma.passwordResetToken.create({
        data: { userId: user.id, token: 'second-token', expiresAt },
      }),
    ).rejects.toThrow();
  });

  it('is deleted after use (single-use enforcement)', async () => {
    const user = await userFactory.build();
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: 'use-once-token', expiresAt },
    });

    await prisma.passwordResetToken.delete({ where: { userId: user.id } });

    const found = await prisma.passwordResetToken.findUnique({ where: { token: 'use-once-token' } });
    expect(found).toBeNull();
  });

  it('cascades delete with user', async () => {
    const user = await userFactory.build();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: 'cascade-token', expiresAt: new Date(Date.now() + 3600000) },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const token = await prisma.passwordResetToken.findUnique({ where: { token: 'cascade-token' } });
    expect(token).toBeNull();
  });
});
