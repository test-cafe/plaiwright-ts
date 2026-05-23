import { prisma } from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatus } from '@/components/shared/order-status';

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{order.fullName}</TableCell>
              <TableCell>{order.email}</TableCell>
              <TableCell>{order.phone}</TableCell>
              <TableCell>
                <OrderStatus variant={order.status} />
              </TableCell>
              <TableCell>${order.totalAmount}</TableCell>
              <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
