import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/cart/checkout/callback/route';
import { OrderStatus } from '@prisma/client';
import {
  buildCheckoutSessionCompleted,
  buildCheckoutSessionWithUnknownOrder,
  INVALID_SIGNATURE_HEADER,
} from '@/tests/fixtures/api/stripe-events';
import { buildOrderRecord, buildUserRecord } from '@/tests/fixtures/mock-prisma-records';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/send-email';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertStatus, assertErrorResponse } from '@/tests/helpers/response-validator';

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

const ORDER_ID = 1;
const USER_ID = 1;
const USER_EMAIL = 'user@test.com';
const PRODUCT_NAME = 'Pepperoni';
const PRODUCT_PRICE = 899;
const ORDER_TOTAL = 899;
const ITEM_QUANTITY = 1;
const VALID_SIGNATURE = 'valid-sig';

const mockOrder = buildOrderRecord({
  id: ORDER_ID,
  userId: USER_ID,
  status: OrderStatus.PENDING,
  totalAmount: ORDER_TOTAL,
  email: USER_EMAIL,
  items: [
    { productItem: { product: { name: PRODUCT_NAME }, price: PRODUCT_PRICE }, quantity: ITEM_QUANTITY },
  ],
  user: buildUserRecord({ id: USER_ID, email: USER_EMAIL }),
});

const webhookRequest = (body: string, signature: string) =>
  request.post(urls.cartCheckoutCallback()).stripeSignature(signature).body(body).build();

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
});

describe('POST /api/cart/checkout/callback', () => {
  describe('signature verification', () => {
    it('returns 400 when Stripe rejects the signature', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No signatures found');
      });

      const response = await POST(webhookRequest('{}', INVALID_SIGNATURE_HEADER));

      await assertErrorResponse(response, 400);
    });
  });

  describe('checkout.session.completed handling', () => {
    it('marks the matching order SUCCEEDED', async () => {
      const event = buildCheckoutSessionCompleted(ORDER_ID);
      mockConstructEvent.mockReturnValue(event);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: OrderStatus.SUCCEEDED });

      const response = await POST(webhookRequest(JSON.stringify(event), VALID_SIGNATURE));

      assertStatus(response, 200);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORDER_ID },
          data: { status: OrderStatus.SUCCEEDED },
        }),
      );
    });

    it('sends a receipt email to the order user', async () => {
      const event = buildCheckoutSessionCompleted(ORDER_ID);
      mockConstructEvent.mockReturnValue(event);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: OrderStatus.SUCCEEDED });

      await POST(webhookRequest(JSON.stringify(event), VALID_SIGNATURE));

      expect(sendEmail).toHaveBeenCalledWith(
        USER_EMAIL,
        expect.stringContaining(String(ORDER_ID)),
        expect.stringContaining(PRODUCT_NAME),
      );
    });
  });

  describe('idempotency', () => {
    it('returns 200 silently when the referenced order does not exist', async () => {
      const event = buildCheckoutSessionWithUnknownOrder();
      mockConstructEvent.mockReturnValue(event);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const response = await POST(webhookRequest(JSON.stringify(event), VALID_SIGNATURE));

      assertStatus(response, 200);
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('unhandled event types', () => {
    it('returns 200 without touching the order', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.created',
        data: { object: {} },
      });

      const response = await POST(webhookRequest('{}', VALID_SIGNATURE));

      assertStatus(response, 200);
    });
  });
});
