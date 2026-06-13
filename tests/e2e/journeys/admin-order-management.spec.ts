import { test } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { createOrderFactory } from '@/tests/fixtures/db/orders';
import { DriverFactory } from '../driver-factory';

const orderFactory = createOrderFactory(prisma as any);

async function seedOrderForAdmin(): Promise<number> {
  const admin = await prisma.user.findFirst({ where: { email: process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com' } });
  if (!admin) throw new Error('Admin user must be seeded before running admin-order tests');
  const order = await orderFactory.build(admin.id);
  return order.id;
}

async function removeOrderIfPresent(id: number) {
  await prisma.order.deleteMany({ where: { id } });
}

test.describe('@regression Admin order management — delete', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  let orderId: number;

  test.beforeEach(async () => {
    orderId = await seedOrderForAdmin();
  });

  test.afterEach(async () => {
    await removeOrderIfPresent(orderId);
  });

  test('admin can delete an order from the orders dashboard', async ({ browser }) => {
    const driver = await DriverFactory.asAdmin(browser);

    await driver.dashboard.gotoOrders();
    await driver.dashboard.assertEntityVisible(orderId);
    await driver.dashboard.deleteEntity(orderId);

    await driver.dashboard.assertEntityRemoved(orderId);

    await driver.dispose();
  });

  test('cancelling the delete confirmation keeps the order intact', async ({ browser }) => {
    const driver = await DriverFactory.asAdmin(browser);

    await driver.dashboard.gotoOrders();
    await driver.dashboard.cancelDeleteEntity(orderId);

    await driver.dashboard.assertEntityVisible(orderId);

    await driver.dispose();
  });
});
