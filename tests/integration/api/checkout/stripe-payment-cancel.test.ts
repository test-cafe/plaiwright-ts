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
  default: vi.fn().mockImplementation(function MockStripe() {
    return { webhooks: { constructEvent: mockConstructEvent } };
  }),
}));

const ORDER_ID = '42';
const VALID_SIGNATURE = 'valid-sig';

const buildCancelEvent = (type: string) => ({
  type,
  data: { object: { metadata: { order_id: ORDER_ID } } },
});

const webhookRequest = (body = '{}', signature = VALID_SIGNATURE) =>
  request.post(urls.cartCheckoutCallback()).stripeSignature(signature).body(body).build();

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
});

describe('POST /api/cart/checkout/callback — payment cancellation', () => {
  describe.each([
    'checkout.session.expired',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
  ])('event "%s"', (eventType) => {
    beforeEach(() => {
      mockConstructEvent.mockReturnValue(buildCancelEvent(eventType));
    });

    it('returns 200', async () => {
      const response = await POST(webhookRequest());

      assertStatus(response, 200);
    });

    it('does not transition order status', async () => {
      await POST(webhookRequest());

      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('does not send a receipt email', async () => {
      await POST(webhookRequest());

      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('does not query the order record', async () => {
      await POST(webhookRequest());

      expect(prisma.order.findFirst).not.toHaveBeenCalled();
    });
  });
});
