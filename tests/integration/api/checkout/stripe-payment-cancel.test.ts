import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/cart/checkout/callback/route';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/send-email';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertStatus } from '@/tests/helpers/response-validator';

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

const mockConstructEvent = vi.hoisted(() => vi.fn());

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function MockStripe(this: any) {
    return { webhooks: { constructEvent: mockConstructEvent } };
  }),
}));

const webhookRequest = (body = '{}', signature = 'valid-sig') =>
  request.post(urls.cartCheckoutCallback()).stripeSignature(signature).body(body).build();

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
});

describe('POST /api/cart/checkout/callback — payment cancellation', () => {
  it('returns 200 without updating order when session expires', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.expired',
      data: { object: { metadata: { order_id: '42' } } },
    });

    const response = await POST(webhookRequest());

    assertStatus(response, 200);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 200 without updating order on payment_intent.payment_failed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { metadata: { order_id: '42' } } },
    });

    const response = await POST(webhookRequest());

    assertStatus(response, 200);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not query the order record for non-completed event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.expired',
      data: { object: { metadata: { order_id: '42' } } },
    });

    await POST(webhookRequest());

    expect(prisma.order.findFirst).not.toHaveBeenCalled();
  });

  it('order stays PENDING — only checkout.session.completed triggers a status transition', async () => {
    const cancelEvents = [
      'checkout.session.expired',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
    ];

    for (const eventType of cancelEvents) {
      vi.clearAllMocks();
      mockConstructEvent.mockReturnValue({ type: eventType, data: { object: {} } });

      const response = await POST(webhookRequest());

      assertStatus(response, 200);
      expect(prisma.order.update).not.toHaveBeenCalled();
    }
  });
});
