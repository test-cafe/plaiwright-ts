import type { CompletedCheckoutSession } from '@/app/api/cart/checkout/callback/route';

export type CheckoutSessionCompletedFixture = {
  type: 'checkout.session.completed';
  data: { object: CompletedCheckoutSession };
};

export function buildCheckoutSessionCompleted(orderId: number): CheckoutSessionCompletedFixture {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: { order_id: String(orderId) },
      },
    },
  };
}

export function buildCheckoutSessionWithUnknownOrder(): CheckoutSessionCompletedFixture {
  return buildCheckoutSessionCompleted(999999);
}

export const INVALID_SIGNATURE_HEADER = 'v1=invalidsignature';
