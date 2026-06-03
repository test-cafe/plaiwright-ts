'use client';

import React from 'react';
import { Title } from './title';
import { ProductCard } from './product-card';
import { cn } from '@/lib/utils';
import { useIntersection } from 'react-use';
import { useCategoryStore } from '@/store/category';
import { CategoryProducts } from '@/@types/prisma';

interface Props {
  title: string;
  products: CategoryProducts['products'];
  className?: string;
  listClassName?: string;
  categoryId: number;
  prioritizeFirst?: boolean;
}

export const ProductsGroupList: React.FC<Props> = ({
  title,
  products,
  listClassName,
  categoryId,
  className,
  prioritizeFirst,
}) => {
  const setActiveId = useCategoryStore((state) => state.setActiveId);
  const locked = useCategoryStore((state) => state.locked);
  const intersectionRef = React.useRef(null);
  const intersection = useIntersection(intersectionRef, {
    threshold: 0.1,
  });

  React.useEffect(() => {
    if (intersection?.isIntersecting && !locked) {
      setActiveId(categoryId);
    }
  }, [intersection?.isIntersecting, locked]);

  return (
    <div className={className} id={title}>
      <Title text={title} size="lg" className="font-extrabold mb-5" />
      <div ref={intersectionRef} className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-[50px]', listClassName)}>
        {products
          .filter((product) => product.items.length > 0)
          .map((product, i) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              imageUrl={product.imageUrl}
              price={product.items[0].price}
              ingredients={product.ingredients}
              priority={prioritizeFirst && i === 0}
            />
          ))}
      </div>
    </div>
  );
};
