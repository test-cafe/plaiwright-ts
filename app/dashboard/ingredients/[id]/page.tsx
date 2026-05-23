import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CreateIngredientForm } from '@/components/shared/dashboard/forms/create-ingredient-form/create-ingredient-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditIngredientPage({ params }: Props) {
  const { id } = await params;
  const ingredient = await prisma.ingredient.findFirst({ where: { id: Number(id) } });
  if (!ingredient) notFound();

  return (
    <div className="max-w-2xl">
      <CreateIngredientForm values={ingredient} />
    </div>
  );
}
