import { prisma } from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatus } from '@/components/shared/order-status';
import { DeleteButton } from '@/components/shared/dashboard/delete-button';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[3rem]">#</TableHead>
            <TableHead className="min-w-[10rem]">Full Name</TableHead>
            <TableHead className="min-w-[16rem]">Email</TableHead>
            <TableHead className="min-w-[8rem]">Phone</TableHead>
            <TableHead className="min-w-[7rem]">Status</TableHead>
            <TableHead className="min-w-[6rem]">Total</TableHead>
            <TableHead className="min-w-[8rem]">Created At</TableHead>
            <TableHead className="min-w-[6rem]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-400 py-16">
                No orders yet.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.fullName}</TableCell>
                <TableCell>{order.email}</TableCell>
                <TableCell>{order.phone}</TableCell>
                <TableCell>
                  <OrderStatus variant={order.status} />
                </TableCell>
                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
                <TableCell>
                  <DeleteButton id={order.id} type="order" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
