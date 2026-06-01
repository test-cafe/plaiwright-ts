import type { PrismaClient } from '@prisma/client';
import { OrderStatus } from '@prisma/client';

export function createOrderFactory(prisma: PrismaClient) {
  return {
    async build(
      userId: number,
      overrides: {
        status?: OrderStatus;
        totalAmount?: number;
        paymentId?: string;
        items?: object;
      } = {},
    ) {
      return prisma.order.create({
        data: {
          userId,
          status: overrides.status ?? OrderStatus.PENDING,
          totalAmount: overrides.totalAmount ?? 1000,
          paymentId: overrides.paymentId ?? 'cs_test_mock',
          fullName: 'Test User',
          address: '123 Test St',
          email: 'user@test.com',
          phone: '+1234567890',
          items: overrides.items ?? [
            {
              productItem: { product: { name: 'Pepperoni' }, price: 899 },
              quantity: 1,
            },
          ],
        },
      });
    },
  };
}
