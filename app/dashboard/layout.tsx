import { getUserSession } from '@/lib/get-user-session';
import { redirect } from 'next/navigation';
import { DashboardMenu } from '@/components/shared/dashboard/dashboard-menu';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Next Pizza | Admin' };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 shrink-0 border-r bg-white py-6">
        <DashboardMenu />
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
