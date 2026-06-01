import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/cart/checkout/callback/route';
import { NextRequest } from 'next/server';
import { OrderStatus } from '@prisma/client';
import {
  buildCheckoutSessionCompleted,
  buildCheckoutSessionWithUnknownOrder,
  INVALID_SIGNATURE_HEADER,
} from '@/tests/fixtures/api/stripe-events';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/send-email';
import Stripe from 'stripe';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/send-email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

const mockStripeInstance = new (Stripe as any)();

const makeWebhookRequest = (body: string, signature: string) =>
  new NextRequest('http://localhost:3000/api/cart/checkout/callback', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': signature },
  });

const mockOrder = {
  id: 1,
  userId: 1,
  status: OrderStatus.PENDING,
  totalAmount: 899,
  items: [{ productItem: { product: { name: 'Pepperoni' }, price: 899 }, quantity: 1 }],
  user: { email: 'user@test.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
});

describe('POST /api/cart/checkout/callback', () => {
  it('returns 400 on invalid Stripe signature', async () => {
    mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found');
    });

    const response = await POST(makeWebhookRequest('{}', INVALID_SIGNATURE_HEADER));
    expect(response.status).toBe(400);
  });

  it('updates order to SUCCEEDED and sends email on checkout.session.completed', async () => {
    const event = buildCheckoutSessionCompleted(1);
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: OrderStatus.SUCCEEDED } as any);

    const response = await POST(makeWebhookRequest(JSON.stringify(event), 'valid-sig'));

    expect(response.status).toBe(200);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { status: OrderStatus.SUCCEEDED },
      }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      'user@test.com',
      expect.stringContaining('1'),
      expect.stringContaining('Pepperoni'),
    );
  });

  it('returns 200 silently when order not found (idempotency)', async () => {
    const event = buildCheckoutSessionWithUnknownOrder();
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    const response = await POST(makeWebhookRequest(JSON.stringify(event), 'valid-sig'));

    expect(response.status).toBe(200);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 200 for unhandled event types', async () => {
    mockStripeInstance.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    });

    const response = await POST(makeWebhookRequest('{}', 'valid-sig'));
    expect(response.status).toBe(200);
  });
});
