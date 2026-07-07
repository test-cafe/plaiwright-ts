import Stripe from 'stripe';

export async function createPayment(details: {
  description: string;
  orderId: number;
  amount: number;
}) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Please set the STRIPE_SECRET_KEY environment variable');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: details.description,
          },
          unit_amount: details.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/?paid`,
    cancel_url: `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/cart`,
    metadata: {
      order_id: String(details.orderId),
    },
  });

  return {
    id: session.id,
    confirmation: {
      confirmation_url: session.url!,
    },
  };
}
