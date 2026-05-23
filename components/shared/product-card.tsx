import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Title } from './title';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  ingredients?: { name: string }[];
  className?: string;
  priority?: boolean;
}

export const ProductCard: React.FC<Props> = ({ id, name, price, imageUrl, ingredients, className, priority }) => {
  return (
    <div className={cn(className)}>
      <Link href={`/product/${id}`} data-testid="product-card">
        <div className="flex justify-center p-6 bg-secondary sm:rounded-lg h-[260px]">
          <Image
            className="w-full sm:w-[215px] h-[215px] object-contain"
            src={imageUrl ?? '/assets/images/not-found.png'}
            alt={name}
            width={215}
            height={215}
            priority={priority}
          />
        </div>

        <Title text={name} size="sm" className="mb-1 mt-3 font-bold px-4 sm:px-0" />

        <p className="text-sm text-gray-400 line-clamp-2 px-4 sm:px-0">
          {ingredients?.map((i) => i.name).join(', ') || ''}
        </p>

        <div className="flex justify-between items-center mt-4 px-4 sm:px-0">
          <span className="text-[20px]">
            from <b>${price}</b>
          </span>

          <Button variant="secondary" className="text-base font-bold">
            <Plus className="w-5 h-5 mr-1" />
            Add
          </Button>
        </div>
      </Link>
    </div>
  );
};
