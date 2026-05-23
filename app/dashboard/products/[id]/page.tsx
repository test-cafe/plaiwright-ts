import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CreateProductForm } from '@/components/shared/dashboard/forms/create-product-form/create-product-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { id: Number(id) } });
  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <CreateProductForm values={product} />
    </div>
  );
}
