import { prisma } from '@/lib/prisma';
import { CreateProductItemForm } from '@/components/shared/dashboard/forms/create-product-item-form/create-product-item-form';

export default async function CreateProductItemPage() {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="max-w-2xl">
      <CreateProductItemForm products={products} />
    </div>
  );
}
