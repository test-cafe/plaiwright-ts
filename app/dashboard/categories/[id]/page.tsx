import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CreateCategoryForm } from '@/components/shared/dashboard/forms/create-category-form/create-category-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await prisma.category.findFirst({ where: { id: Number(id) } });
  if (!category) notFound();

  return (
    <div className="max-w-2xl">
      <CreateCategoryForm values={category} />
    </div>
  );
}
