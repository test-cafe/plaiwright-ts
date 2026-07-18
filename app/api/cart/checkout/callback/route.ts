import { NextRequest } from 'next/server';
import { OrderStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/send-email';
import { prisma } from '@/lib/prisma';
import { CartItemDTO } from '@/services/dto/cart';
import Stripe from 'stripe';

export type CompletedCheckoutSession = Pick<Stripe.Checkout.Session, 'metadata'>;

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.error({ err }, '[STRIPE_WEBHOOK] signature verification failed');
    return new Response(`Webhook error: ${err}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as CompletedCheckoutSession;
    const orderId = Number(session.metadata?.order_id);

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { user: true },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.SUCCEEDED },
      });

      const items = order.items as unknown as CartItemDTO[];

      const html = `
      <h1>Thank you for your purchase!</h1>

      <p>Your order #${order.id} has been paid. Item list:</p>

      <hr />

      <ul>
          ${items
            .map((item) => `<li>${item.productItem.product.name} | (${item.productItem.price} x ${item.quantity} pcs.)</li>`)
            .join('')}
      </ul>
      `;

      await sendEmail(order.user.email, `Next Pizza / Order #${order.id} paid!`, html);
    }
  }

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as CompletedCheckoutSession;
    const orderId = Number(session.metadata?.order_id);

    const { count } = await prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CANCELLED },
    });

    if (count > 0) {
      logger.info({ orderId, eventType: event.type }, '[STRIPE_WEBHOOK] order cancelled');
    }
  }

  return new Response(null, { status: 200 });
}
