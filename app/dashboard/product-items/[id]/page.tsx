import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CreateProductItemForm } from '@/components/shared/dashboard/forms/create-product-item-form/create-product-item-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductItemPage({ params }: Props) {
  const { id } = await params;
  const [productItem, products] = await Promise.all([
    prisma.productItem.findFirst({ where: { id: Number(id) } }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!productItem) notFound();

  return (
    <div className="max-w-2xl">
      <CreateProductItemForm values={productItem} products={products} />
    </div>
  );
}
