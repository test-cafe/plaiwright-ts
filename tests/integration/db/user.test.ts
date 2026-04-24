import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeUser, makeVerificationCode, makeExpiredVerificationCode } from '../../factories';
import { UserRole } from '@prisma/client';

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('User model', () => {
  it('creates a user with default role USER', async () => {
    const data = makeUser();

    const user = await prisma.user.create({ data });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(data.email);
    expect(user.fullName).toBe(data.fullName);
    expect(user.role).toBe(UserRole.USER);
    expect(user.verified).toBeNull();
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('enforces unique email constraint', async () => {
    const data = makeUser();
    await prisma.user.create({ data });

    await expect(prisma.user.create({ data })).rejects.toThrow();
  });

  it('creates an admin user', async () => {
    const data = makeUser({ role: UserRole.ADMIN });

    const user = await prisma.user.create({ data });

    expect(user.role).toBe(UserRole.ADMIN);
  });

  it('stores verified timestamp', async () => {
    const verifiedAt = new Date();
    const data = makeUser({ verified: verifiedAt });

    const user = await prisma.user.create({ data });

    expect(user.verified).toEqual(verifiedAt);
  });

  it('stores OAuth provider fields', async () => {
    const data = makeUser({ provider: 'google', providerId: 'google-uid-123' });

    const user = await prisma.user.create({ data });

    expect(user.provider).toBe('google');
    expect(user.providerId).toBe('google-uid-123');
  });

  it('finds user by email', async () => {
    const data = makeUser();
    await prisma.user.create({ data });

    const found = await prisma.user.findUnique({ where: { email: data.email } });

    expect(found).not.toBeNull();
    expect(found!.email).toBe(data.email);
  });

  it('returns null for non-existent email', async () => {
    const found = await prisma.user.findUnique({ where: { email: 'nobody@example.com' } });

    expect(found).toBeNull();
  });
});

describe('VerificationCode model', () => {
  it('creates a verification code linked to user', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const codeData = makeVerificationCode(user.id);

    const code = await prisma.verificationCode.create({ data: codeData });

    expect(code.userId).toBe(user.id);
    expect(code.code).toHaveLength(6);
    expect(code.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('enforces one code per user (unique userId)', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    await prisma.verificationCode.create({ data: makeVerificationCode(user.id) });

    await expect(
      prisma.verificationCode.create({ data: makeVerificationCode(user.id) })
    ).rejects.toThrow();
  });

  it('cascade deletes code when user is deleted', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    await prisma.verificationCode.create({ data: makeVerificationCode(user.id) });

    await prisma.user.delete({ where: { id: user.id } });

    const code = await prisma.verificationCode.findFirst({ where: { userId: user.id } });
    expect(code).toBeNull();
  });

  it('creates an expired verification code', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const codeData = makeExpiredVerificationCode(user.id);

    const code = await prisma.verificationCode.create({ data: codeData });

    expect(code.expiresAt.getTime()).toBeLessThan(Date.now());
  });
});
