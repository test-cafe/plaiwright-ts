import { NextRequest } from 'next/server';
import { OrderStatus } from '@prisma/client';
import { sendEmail } from '@/lib/send-email';
import { prisma } from '@/lib/prisma';
import { CartItemDTO } from '@/services/dto/cart';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook error: ${err}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
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

  return new Response(null, { status: 200 });
}
