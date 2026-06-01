import { vi } from 'vitest';

export const mockStripeSession = {
  id: 'cs_test_mock_session_id',
  url: 'https://checkout.stripe.com/pay/cs_test_mock',
  metadata: { order_id: '1' },
};

export const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockStripeSession),
    },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => mockStripe),
  };
});

export function mockStripeWebhookSuccess(orderId: number) {
  mockStripe.webhooks.constructEvent.mockReturnValue({
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: { order_id: String(orderId) },
        payment_status: 'paid',
      },
    },
  });
}

export function mockStripeWebhookInvalidSignature() {
  mockStripe.webhooks.constructEvent.mockImplementation(() => {
    throw new Error('No signatures found matching the expected signature for payload.');
  });
}

export function resetStripeMocks() {
  vi.clearAllMocks();
}
