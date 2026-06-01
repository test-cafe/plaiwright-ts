import { vi } from 'vitest';
import type { Session } from 'next-auth';

export const mockAdminSession: Session = {
  user: {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUserSession: Session = {
  user: {
    id: '2',
    email: 'user@test.com',
    name: 'Regular User',
    role: 'USER',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Mocks next-auth getServerSession to return the provided session.
 * Call this in beforeEach to simulate an authenticated user.
 */
export function mockSession(session: Session | null) {
  vi.mock('next-auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('next-auth')>();
    return {
      ...actual,
      getServerSession: vi.fn().mockResolvedValue(session),
    };
  });
}

export function mockUnauthenticated() {
  mockSession(null);
}
