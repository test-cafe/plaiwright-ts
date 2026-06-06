import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/cart/checkout/callback/route';
import { OrderStatus } from '@prisma/client';
import {
  buildCheckoutSessionCompleted,
  buildCheckoutSessionWithUnknownOrder,
  INVALID_SIGNATURE_HEADER,
} from '@/tests/fixtures/api/stripe-events';
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

// vi.hoisted ensures mockConstructEvent is defined before the vi.mock factory runs
const mockConstructEvent = vi.hoisted(() => vi.fn());

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function MockStripe(this: any) {
    return { webhooks: { constructEvent: mockConstructEvent } };
  }),
}));

const webhookRequest = (body: string, signature: string) =>
  request.post(urls.cartCheckoutCallback()).stripeSignature(signature).body(body).build();

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
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found');
    });

    const response = await POST(webhookRequest('{}', INVALID_SIGNATURE_HEADER));

    await assertErrorResponse(response, 400);
  });

  it('updates order to SUCCEEDED and sends email on checkout.session.completed', async () => {
    const event = buildCheckoutSessionCompleted(1);
    mockConstructEvent.mockReturnValue(event);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...mockOrder,
      status: OrderStatus.SUCCEEDED,
    } as any);

    const response = await POST(webhookRequest(JSON.stringify(event), 'valid-sig'));

    assertStatus(response, 200);
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
    mockConstructEvent.mockReturnValue(event);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    const response = await POST(webhookRequest(JSON.stringify(event), 'valid-sig'));

    assertStatus(response, 200);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 200 for unhandled event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    });

    const response = await POST(webhookRequest('{}', 'valid-sig'));

    assertStatus(response, 200);
  });
});
