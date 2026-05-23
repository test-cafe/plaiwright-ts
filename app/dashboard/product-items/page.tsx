import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteButton } from '@/components/shared/dashboard/delete-button';

export default async function ProductItemsPage() {
  const productItems = await prisma.productItem.findMany({
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Items</h1>
        <Button asChild>
          <Link href="/dashboard/product-items/create">Create New</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[3rem]">#</TableHead>
            <TableHead className="min-w-[14rem]">Product</TableHead>
            <TableHead className="min-w-[6rem]">Price</TableHead>
            <TableHead className="min-w-[5rem]">Size</TableHead>
            <TableHead className="min-w-[7rem]">Pizza Type</TableHead>
            <TableHead className="min-w-[8rem]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.product.name}</TableCell>
              <TableCell>{item.price}</TableCell>
              <TableCell>{item.size ?? '—'}</TableCell>
              <TableCell>{item.pizzaType ?? '—'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/product-items/${item.id}`}>Edit</Link>
                  </Button>
                  <DeleteButton id={item.id} type="product-items" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
