import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createUserFactory } from '@/tests/fixtures/db/users';
import { registerUser, createUser, updateUser, deleteUser } from '@/app/actions';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/send-email';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(() => ({ get: vi.fn(() => undefined) })) }));
vi.mock('@/lib/send-email', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/create-payment', () => ({ createPayment: vi.fn() }));
vi.mock('@/lib/get-user-session');
vi.mock('bcrypt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bcrypt')>();
  return { ...actual, hashSync: vi.fn(() => 'hashed-password') };
});

const prisma = useTestDb();
const userFactory = createUserFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
  vi.clearAllMocks();
});

describe('registerUser', () => {
  it('creates a new user with a hashed password', async () => {
    await registerUser({ email: 'new@test.com', password: 'secret', fullName: 'New User' });

    const user = await prisma.user.findFirst({ where: { email: 'new@test.com' } });
    expect(user).not.toBeNull();
    expect(user?.password).toBe('hashed-password');
    expect(user?.email).toBe('new@test.com');
  });

  it('throws when the email is already registered', async () => {
    await userFactory.build({ email: 'dup@test.com' });

    await expect(
      registerUser({ email: 'dup@test.com', password: 'secret', fullName: 'Dup User' }),
    ).rejects.toThrow('User already exists');
  });

  it('leaves the new user unverified and emails a verification link', async () => {
    await registerUser({ email: 'unverified@test.com', password: 'pass', fullName: 'V User' });

    const user = await prisma.user.findFirst({ where: { email: 'unverified@test.com' } });
    expect(user?.verified).toBeNull();

    const verificationCode = await prisma.verificationCode.findFirst({ where: { userId: user!.id } });
    expect(verificationCode).not.toBeNull();

    expect(sendEmail).toHaveBeenCalledWith(
      'unverified@test.com',
      expect.stringContaining('Verify'),
      expect.stringContaining(verificationCode!.code),
    );
  });

  it('resends the verification code when an unverified user registers again', async () => {
    const user = await userFactory.buildUnverified({ email: 'retry@test.com' });
    const staleCode = await prisma.verificationCode.create({
      data: { userId: user.id, code: 'stale-code', expiresAt: new Date() },
    });

    await registerUser({ email: 'retry@test.com', password: 'pass', fullName: 'Retry User' });

    const freshCode = await prisma.verificationCode.findFirst({ where: { userId: user.id } });
    expect(freshCode?.code).not.toBe(staleCode.code);
    expect(sendEmail).toHaveBeenCalledOnce();
  });
});

describe('createUser (dashboard)', () => {
  it('persists user and revalidates dashboard path', async () => {
    await createUser({ email: 'dash@test.com', password: 'pass', fullName: 'Dash User' });

    const user = await prisma.user.findFirst({ where: { email: 'dash@test.com' } });
    expect(user).not.toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/users');
  });

  it('hashes password before storing', async () => {
    await createUser({ email: 'hashed@test.com', password: 'plaintext', fullName: 'H User' });

    const user = await prisma.user.findFirst({ where: { email: 'hashed@test.com' } });
    expect(user?.password).toBe('hashed-password');
  });
});

describe('updateUser (dashboard)', () => {
  it('updates fullName and email', async () => {
    const user = await userFactory.build({ email: 'old@test.com', fullName: 'Old Name' });

    await updateUser(user.id, { fullName: 'New Name', email: 'new@test.com' });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.fullName).toBe('New Name');
    expect(updated?.email).toBe('new@test.com');
  });

  it('hashes password when provided', async () => {
    const user = await userFactory.build();

    await updateUser(user.id, { password: 'newpass' });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.password).toBe('hashed-password');
  });

  it('sets verified to current date on update', async () => {
    const user = await userFactory.buildUnverified();

    await updateUser(user.id, { fullName: 'Still Unverified' });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.verified).not.toBeNull();
  });
});

describe('deleteUser (dashboard)', () => {
  it('removes the user from the database', async () => {
    const user = await userFactory.build();

    await deleteUser(user.id);

    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).toBeNull();
  });

  it('revalidates dashboard path after deletion', async () => {
    const user = await userFactory.build();

    await deleteUser(user.id);

    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/users');
  });
});
