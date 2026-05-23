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
    <div className={cn('group transition-transform duration-200 hover:-translate-y-1', className)}>
      <Link href={`/product/${id}`} data-testid="product-card">
        {/* Mobile: horizontal layout */}
        <div className="flex sm:hidden items-center gap-4 bg-secondary rounded-xl p-3 transition-shadow duration-200 group-hover:shadow-md">
          <Image
            className="w-[90px] h-[90px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
            src={imageUrl ?? '/assets/images/not-found.png'}
            alt={name}
            width={90}
            height={90}
            priority={priority}
          />
          <div className="flex-1 min-w-0">
            <Title text={name} size="sm" className="font-bold mb-1 leading-tight" />
            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
              {ingredients?.map((i) => i.name).join(', ') || ''}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">from ${price}</span>
              <Button size="sm" className="font-bold">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop: vertical layout */}
        <div className="hidden sm:block">
          <div className="flex justify-center p-6 bg-secondary rounded-lg h-[260px] transition-shadow duration-200 group-hover:shadow-lg">
            <Image
              className="w-[215px] h-[215px] object-contain transition-transform duration-200 group-hover:scale-105"
              src={imageUrl ?? '/assets/images/not-found.png'}
              alt={name}
              width={215}
              height={215}
              priority={priority}
            />
          </div>

          <Title text={name} size="sm" className="mb-1 mt-3 font-bold" />

          <p className="text-sm text-gray-400 line-clamp-2">
            {ingredients?.map((i) => i.name).join(', ') || ''}
          </p>

          <div className="flex justify-between items-center mt-4">
            <span className="text-[20px]">
              from <b>${price}</b>
            </span>
            <Button className="text-base font-bold">
              <Plus className="w-5 h-5 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
};
