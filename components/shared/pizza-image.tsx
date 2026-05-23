import { PizzaSize } from '@/lib/pizza-details-to-text';
import { cn } from '@/lib/utils';
import React from 'react';
import Image from 'next/image';

interface Props {
  className?: string;
  imageUrl: string;
  size: PizzaSize;
}

export const PizzaImage: React.FC<Props> = ({ className, imageUrl, size }) => {
  return (
    <div className={cn('flex items-center justify-center relative w-full h-[220px] md:flex-1 md:h-auto', className)}>
      <Image
        src={imageUrl}
        alt="Pizza"
        width={500}
        height={500}
        priority
        className={cn('relative transition-all z-10 duration-300', {
          'w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] md:w-[300px] md:h-[300px]': size === 20,
          'w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px]': size === 30,
          'w-[250px] h-[250px] sm:w-[380px] sm:h-[380px] md:w-[500px] md:h-[500px]': size === 40,
        })}
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-dashed border-2 rounded-full border-gray-200 w-[220px] h-[220px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-dotted border-2 rounded-full border-gray-100 w-[180px] h-[180px] sm:w-[280px] sm:h-[280px] md:w-[370px] md:h-[370px]" />
    </div>
  );
};
