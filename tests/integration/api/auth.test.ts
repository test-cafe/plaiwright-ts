// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeUser, makeVerificationCode, makeExpiredVerificationCode } from '../../factories';

const mockGetUserSession = vi.fn();

vi.mock('@/lib/get-user-session', () => ({
  getUserSession: mockGetUserSession,
}));

beforeEach(async () => {
  await cleanDb();
  mockGetUserSession.mockReset();
});

afterAll(async () => {
  await disconnectDb();
});

describe('GET /api/auth/me', () => {
  it('returns 401 when not authenticated', async () => {
    const { GET } = await import('@/app/api/auth/me/route');
    mockGetUserSession.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('[USER_GET] Unauthorized');
  });

  it('returns user data when authenticated', async () => {
    const { GET } = await import('@/app/api/auth/me/route');
    const user = await prisma.user.create({
      data: makeUser({ fullName: 'John Doe', email: 'john@example.com' }),
    });
    mockGetUserSession.mockResolvedValue({ id: String(user.id), email: user.email });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fullName).toBe('John Doe');
    expect(body.email).toBe('john@example.com');
    expect(body.password).toBeUndefined();
  });
});

describe('GET /api/auth/verify', () => {
  it('returns 400 when code param is missing', async () => {
    const { GET } = await import('@/app/api/auth/verify/route');
    const req = new NextRequest('http://localhost/api/auth/verify');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Code is required');
  });

  it('returns 400 for invalid code', async () => {
    const { GET } = await import('@/app/api/auth/verify/route');
    const req = new NextRequest('http://localhost/api/auth/verify?code=000000');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid code');
  });

  it('returns 400 for expired code', async () => {
    const { GET } = await import('@/app/api/auth/verify/route');
    const user = await prisma.user.create({ data: makeUser() });
    const codeData = makeExpiredVerificationCode(user.id);
    await prisma.verificationCode.create({ data: codeData });

    const req = new NextRequest(`http://localhost/api/auth/verify?code=${codeData.code}`);
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Code expired');
  });

  it('marks user as verified and deletes code on success', async () => {
    const { GET } = await import('@/app/api/auth/verify/route');
    const user = await prisma.user.create({ data: makeUser() });
    const codeData = makeVerificationCode(user.id, { code: '123456' });
    await prisma.verificationCode.create({ data: codeData });

    const req = new NextRequest('http://localhost/api/auth/verify?code=123456');
    const res = await GET(req);

    expect(res.status).toBe(307);

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updatedUser!.verified).not.toBeNull();

    const deletedCode = await prisma.verificationCode.findFirst({ where: { userId: user.id } });
    expect(deletedCode).toBeNull();
  });
});
