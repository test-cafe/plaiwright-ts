import { CheckCircle2, XCircle } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@/components/shared/container';
import { OrderItem } from '@/components/shared/order-item';
import { Title } from '@/components/shared/title';
import { getUserSession } from '@/lib/get-user-session';
import { prisma } from '@/lib/prisma';
import { CartItemDTO } from '@/services/dto/cart';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Pizza | Order',
  description: 'Order details.',
  robots: 'noindex',
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
}) {
  const session = await getUserSession();

  if (!session) {
    return redirect('/not-auth');
  }

  const { id } = await params;
  const { paid, canceled } = await searchParams;

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return notFound();
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: Number(session.id) },
  });

  if (!order) {
    return notFound();
  }

  const showPaidBanner = paid !== undefined;
  const showCanceledBanner = canceled !== undefined && order.status === 'PENDING';

  return (
    <Container className="my-5">
      <div className="w-full max-w-3xl mb-20">
        {showPaidBanner && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-2xl p-5 mb-8">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">Thank you! Your order has been placed.</p>
              <p className="text-sm mt-1">
                {order.status === 'PENDING'
                  ? 'We are confirming your payment — the status will update in a moment.'
                  : 'Payment confirmed. A receipt has been sent to your email.'}
              </p>
            </div>
          </div>
        )}

        {showCanceledBanner && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-5 mb-8">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">Payment was not completed.</p>
              <p className="text-sm mt-1">
                Your order is saved. You can complete the payment using the link we sent to your email.
              </p>
            </div>
          </div>
        )}

        <Title text={`Order #${order.id}`} size="xl" className="font-extrabold mb-8" />

        <OrderItem
          id={order.id}
          exanded
          items={Array.isArray(order.items) ? (order.items as unknown as CartItemDTO[]) : []}
          createdAt={order.createdAt.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })}
          totalAmount={order.totalAmount}
          status={order.status}
        />
      </div>
    </Container>
  );
}
