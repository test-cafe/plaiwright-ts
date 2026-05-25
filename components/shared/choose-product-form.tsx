'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { Button } from '../ui/button';
import { Title } from './title';
import { IProduct } from '@/hooks/use-choose-pizza';
import toast from 'react-hot-toast';
import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';

interface Props {
  imageUrl: string;
  name: string;
  className?: string;
  items?: IProduct['items'];
  onClickAdd?: VoidFunction;
}

export const ChooseProductForm: React.FC<Props> = ({
  name,
  items,
  imageUrl,
  onClickAdd,
  className,
}) => {
  const { addCartItem, loading } = useCart();

  const productItem = items?.[0];

  if (!productItem) {
    return null;
  }

  const productPrice = productItem.price;

  const handleClickAdd = async () => {
    try {
      await addCartItem({
        productItemId: productItem.id,
        quantity: 1,
      });
      toast.success('Item added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }

    onClickAdd?.();
  };

  return (
    <div className={cn(className, 'flex flex-col md:flex-row flex-1')}>
      <div className="flex items-center justify-center flex-1 relative w-full">
        <Image
          src={imageUrl}
          alt={name}
          width={350}
          height={350}
          priority
          className="relative left-2 top-2 transition-all z-10 duration-300 w-[200px] h-[200px] md:w-[350px] md:h-[350px]"
        />
      </div>

      <div className="w-full md:w-[490px] bg-[#FCFCFC] p-4 md:p-7">
        <Title text={name} size="md" className="font-extrabold mb-1" />

        <Button
          loading={loading}
          onClick={handleClickAdd}
          data-testid="add-to-cart-button"
          className="h-[55px] px-10 text-base rounded-[18px] w-full mt-10">
          Add to cart for ${productPrice}
        </Button>
      </div>
    </div>
  );
};
