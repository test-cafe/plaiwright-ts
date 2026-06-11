import type { MockedFunction } from 'vitest';
import type { Session } from 'next-auth';
import { UserRole } from '@prisma/client';
import type { getUserSession } from '@/lib/get-user-session';

type SessionMock = MockedFunction<typeof getUserSession>;

export const mockAdminSession: Session = {
  user: {
    id: '1',
    name: 'Admin User',
    image: '',
    role: UserRole.ADMIN,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUserSession: Session = {
  user: {
    id: '2',
    name: 'Regular User',
    image: '',
    role: UserRole.USER,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Convenience: the `user` sub-object returned by getUserSession() directly
export const mockAdminUser = mockAdminSession.user!;
export const mockRegularUser = mockUserSession.user!;

/**
 * Sets the resolved value on a mock function (e.g. vi.mocked(getUserSession)).
 *
 * Usage — declare the mock at module level, then call setSession in beforeEach:
 *   vi.mock('@/lib/get-user-session', () => ({ getUserSession: vi.fn() }));
 *   import { getUserSession } from '@/lib/get-user-session';
 *
 *   beforeEach(() => setSession(vi.mocked(getUserSession), mockRegularUser));
 */
export function setSession(mockFn: SessionMock, value: Session['user']): void {
  mockFn.mockResolvedValue(value);
}

export function clearSession(mockFn: SessionMock): void {
  mockFn.mockResolvedValue(null);
}
