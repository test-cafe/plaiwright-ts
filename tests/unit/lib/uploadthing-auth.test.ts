import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSession } from '@/lib/get-user-session';
import { UploadThingError } from 'uploadthing/server';

vi.mock('@/lib/get-user-session');

vi.mock('uploadthing/next', () => ({
  createUploadthing: vi.fn(() =>
    vi.fn(() => ({
      middleware: vi.fn().mockReturnThis(),
      onUploadComplete: vi.fn().mockReturnThis(),
    })),
  ),
}));

import { imageUploaderMiddleware } from '@/app/api/uploadthing/core';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UploadThing imageUploader — auth middleware', () => {
  it('throws Unauthorized when no session exists', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    await expect(imageUploaderMiddleware()).rejects.toThrow('Unauthorized');
  });

  it('throws a UploadThingError for unauthenticated requests', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    await expect(imageUploaderMiddleware()).rejects.toBeInstanceOf(UploadThingError);
  });

  it('returns userId metadata for authenticated USER-role user', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      id: '7',
      email: 'user@test.com',
      role: 'USER',
      name: 'Regular User',
    } as any);

    await expect(imageUploaderMiddleware()).resolves.toEqual({ userId: '7' });
  });

  it('returns userId metadata for authenticated ADMIN-role user', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
      name: 'Admin',
    } as any);

    await expect(imageUploaderMiddleware()).resolves.toEqual({ userId: '1' });
  });
});
