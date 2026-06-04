import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSession } from '@/lib/get-user-session';
import { redirect } from 'next/navigation';

vi.mock('@/lib/get-user-session');
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));
vi.mock('@/components/shared/dashboard/dashboard-menu', () => ({
  DashboardMenu: () => null,
}));

import DashboardLayout from '@/app/dashboard/layout';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DashboardLayout — role guard', () => {
  it('redirects to / when user is not authenticated', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    await DashboardLayout({ children: null as any });

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('redirects to / when authenticated user has USER role', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      id: '2',
      email: 'user@test.com',
      role: 'USER',
      name: 'Regular User',
    } as any);

    await DashboardLayout({ children: null as any });

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('does not redirect when user has ADMIN role', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
      name: 'Admin User',
    } as any);

    await DashboardLayout({ children: null as any });

    expect(redirect).not.toHaveBeenCalled();
  });

  it('calls redirect exactly once for non-admin (no double-redirect)', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null);

    await DashboardLayout({ children: null as any });

    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
