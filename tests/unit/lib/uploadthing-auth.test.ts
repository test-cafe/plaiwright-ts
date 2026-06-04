import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSession } from '@/lib/get-user-session';
import { UploadThingError } from 'uploadthing/server';

vi.mock('@/lib/get-user-session');

// Mirrors the imageUploader middleware in app/api/uploadthing/core.ts
async function runMiddleware() {
  const user = await getUserSession();
  if (!user) throw new UploadThingError('Unauthorized');
  return { userId: user.id };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UploadThing imageUploader — auth middleware', () => {
  it('throws Unauthorized when no session exists', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    await expect(runMiddleware()).rejects.toThrow('Unauthorized');
  });

  it('throws a UploadThingError for unauthenticated requests', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    await expect(runMiddleware()).rejects.toBeInstanceOf(UploadThingError);
  });

  it('returns userId metadata for authenticated USER-role user', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      id: '7',
      email: 'user@test.com',
      role: 'USER',
      name: 'Regular User',
    } as any);

    await expect(runMiddleware()).resolves.toEqual({ userId: '7' });
  });

  it('returns userId metadata for authenticated ADMIN-role user', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
      name: 'Admin',
    } as any);

    await expect(runMiddleware()).resolves.toEqual({ userId: '1' });
  });
});
