import { ChoosePizzaForm } from '@/components/shared/choose-pizza-form';
import { Container } from '@/components/shared/container';
import { ProductsGroupList } from '@/components/shared/products-group-list';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { id: Number(id) } });

  if (!product) {
    return { title: 'Next Pizza | Product not found' };
  }

  return {
    title: `Next Pizza | ${product.name}`,
    description: `Order ${product.name} from Next Pizza — fast delivery, fresh ingredients.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: {
      id: Number(id),
    },
    include: {
      ingredients: true,
      category: {
        include: {
          products: {
            include: {
              items: true,
              ingredients: true,
            },
          },
        },
      },
      items: {
        orderBy: {
          price: 'asc',
        },
        include: {
          product: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return notFound();
  }

  return (
    <Container className="flex flex-col my-10">
      <ChoosePizzaForm
        imageUrl={product.imageUrl}
        name={product.name}
        items={product.items}
        ingredients={product.ingredients}
      />

      <ProductsGroupList
        className="mt-20"
        listClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        key={product.category.id}
        title="Recommendations"
        products={product.category.products}
        categoryId={product.category.id}
      />
    </Container>
  );
}
