import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Props {
  src: string;
  className?: string;
}

export const CartItemDetailsImage: React.FC<Props> = ({ src, className }) => {
  return (
    <Image
      width={60}
      height={60}
      className={cn('w-10 h-10 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]', className)}
      src={src}
      alt="Cart item"
    />
  );
};
