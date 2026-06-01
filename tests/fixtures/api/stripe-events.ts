import type Stripe from 'stripe';

export function buildCheckoutSessionCompleted(orderId: number): Stripe.Event {
  return {
    id: `evt_test_${orderId}`,
    type: 'checkout.session.completed',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: null,
    data: {
      object: {
        id: 'cs_test_mock',
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        metadata: { order_id: String(orderId) },
      } as Stripe.Checkout.Session,
    },
  } as Stripe.Event;
}

export function buildCheckoutSessionWithUnknownOrder(): Stripe.Event {
  return buildCheckoutSessionCompleted(999999);
}

export const INVALID_SIGNATURE_HEADER = 'v1=invalidsignature';
