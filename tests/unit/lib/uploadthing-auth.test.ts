import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';
import { UserRole } from '@prisma/client';
import { getUserSession } from '@/lib/get-user-session';
import { UploadThingError } from 'uploadthing/server';
import { imageUploaderMiddleware } from '@/app/api/uploadthing/core';

vi.mock('@/lib/get-user-session');

vi.mock('uploadthing/next', () => ({
  createUploadthing: vi.fn(() =>
    vi.fn(() => ({
      middleware: vi.fn().mockReturnThis(),
      onUploadComplete: vi.fn().mockReturnThis(),
    })),
  ),
}));

type SessionUser = Session['user'];

const USER_ID = '7';
const ADMIN_ID = '1';

const regularUser: SessionUser = {
  id: USER_ID,
  role: UserRole.USER,
  name: 'Regular User',
  image: '',
};

const adminUser: SessionUser = {
  id: ADMIN_ID,
  role: UserRole.ADMIN,
  name: 'Admin',
  image: '',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UploadThing imageUploader — auth middleware', () => {
  describe('when no session exists', () => {
    beforeEach(() => {
      vi.mocked(getUserSession).mockResolvedValue(null);
    });

    it('rejects with an Unauthorized message', async () => {
      await expect(imageUploaderMiddleware()).rejects.toThrow('Unauthorized');
    });

    it('rejects with an UploadThingError instance', async () => {
      await expect(imageUploaderMiddleware()).rejects.toBeInstanceOf(UploadThingError);
    });
  });

  describe('when an authenticated user is present', () => {
    it('returns userId metadata for a USER-role session', async () => {
      vi.mocked(getUserSession).mockResolvedValue(regularUser);

      const metadata = await imageUploaderMiddleware();

      expect(metadata).toEqual({ userId: USER_ID });
    });

    it('returns userId metadata for an ADMIN-role session', async () => {
      vi.mocked(getUserSession).mockResolvedValue(adminUser);

      const metadata = await imageUploaderMiddleware();

      expect(metadata).toEqual({ userId: ADMIN_ID });
    });
  });
});
