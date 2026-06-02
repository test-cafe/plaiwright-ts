import { Container } from '@/components/shared/container';
import { OrderItem } from '@/components/shared/order-item';
import { Title } from '@/components/shared/title';
import { getUserSession } from '@/lib/get-user-session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Pizza | My Orders',
  description: 'View your order history.',
  robots: 'noindex',
};

export default async function OrdersPage() {
  const session = await getUserSession();

  if (!session) {
    return redirect('/not-auth');
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: Number(session?.id),
    },
  });

  return (
    <Container className="my-5">
      <Title text="My Orders" size="xl" className="font-extrabold mb-8" />

      <div className="flex flex-col gap-6 md:gap-10 flex-1 mb-20 w-full max-w-3xl">
        {orders.length === 0 ? (
          <p className="text-gray-400 text-center py-20">You have no orders yet.</p>
        ) : (
          orders.map((order) => (
            <OrderItem
              key={order.id}
              id={order.id}
              items={order.items ? JSON.parse(order.items as string) : []}
              createdAt={order.createdAt.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
              })}
              totalAmount={order.totalAmount}
              status={order.status}
            />
          ))
        )}
      </div>
    </Container>
  );
}
