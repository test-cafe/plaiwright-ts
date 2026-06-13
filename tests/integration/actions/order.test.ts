import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createUserFactory } from '@/tests/fixtures/db/users';
import { createOrderFactory } from '@/tests/fixtures/db/orders';
import { deleteOrder } from '@/app/actions';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(() => ({ get: vi.fn(() => undefined) })) }));
vi.mock('@/lib/send-email', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/create-payment', () => ({ createPayment: vi.fn() }));
vi.mock('@/lib/get-user-session');

const prisma = useTestDb();
const userFactory = createUserFactory(prisma as any);
const orderFactory = createOrderFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
  vi.clearAllMocks();
});

describe('deleteOrder (dashboard)', () => {
  it('removes the order from the database', async () => {
    const user = await userFactory.build();
    const order = await orderFactory.build(user.id);

    await deleteOrder(order.id);

    const found = await prisma.order.findUnique({ where: { id: order.id } });
    expect(found).toBeNull();
  });

  it('revalidates dashboard path after deletion', async () => {
    const user = await userFactory.build();
    const order = await orderFactory.build(user.id);

    await deleteOrder(order.id);

    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/orders');
  });

  it('throws when the order does not exist', async () => {
    await expect(deleteOrder(99999)).rejects.toThrow();
  });
});
