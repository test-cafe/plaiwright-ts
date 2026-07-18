import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderStatus } from '@prisma/client';
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
      updateMany: vi.fn(),
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
  vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
});

describe('POST /api/cart/checkout/callback — payment cancellation', () => {
  describe.each(['checkout.session.expired', 'checkout.session.async_payment_failed'])(
    'event "%s"',
    (eventType) => {
      beforeEach(() => {
        mockConstructEvent.mockReturnValue(buildCancelEvent(eventType));
      });

      it('returns 200', async () => {
        const response = await POST(webhookRequest());

        assertStatus(response, 200);
      });

      it('cancels the pending order', async () => {
        await POST(webhookRequest());

        expect(prisma.order.updateMany).toHaveBeenCalledWith({
          where: { id: Number(ORDER_ID), status: OrderStatus.PENDING },
          data: { status: OrderStatus.CANCELLED },
        });
      });

      it('does not touch orders that are no longer pending', async () => {
        vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 0 });

        const response = await POST(webhookRequest());

        assertStatus(response, 200);
        expect(prisma.order.update).not.toHaveBeenCalled();
      });

      it('does not send a receipt email', async () => {
        await POST(webhookRequest());

        expect(sendEmail).not.toHaveBeenCalled();
      });
    },
  );

  describe.each(['payment_intent.payment_failed', 'payment_intent.canceled'])(
    'unrelated event "%s"',
    (eventType) => {
      beforeEach(() => {
        mockConstructEvent.mockReturnValue(buildCancelEvent(eventType));
      });

      it('returns 200 without touching orders', async () => {
        const response = await POST(webhookRequest());

        assertStatus(response, 200);
        expect(prisma.order.update).not.toHaveBeenCalled();
        expect(prisma.order.updateMany).not.toHaveBeenCalled();
        expect(sendEmail).not.toHaveBeenCalled();
      });
    },
  );
});
