'use client';

import { cn } from '@/lib/utils';
import React from 'react';

type Variant = {
  name: string;
  value: string;
  disabled?: boolean;
};

interface Props {
  items: readonly Variant[];
  defaultValue?: string;
  onClick?: (value: Variant['value']) => void;
  className?: string;
  selectedValue?: Variant['value'];
  testIdPrefix?: string;
}

export const GroupVariants: React.FC<Props> = ({ items, onClick, className, selectedValue, testIdPrefix }) => {
  return (
    <div className={cn(className, 'flex justify-between bg-[#F3F3F7] rounded-3xl p-1 select-none')}>
      {items.map((item) => (
        <div
          key={item.name}
          data-testid={testIdPrefix}
          onClick={() => onClick?.(item.value)}
          aria-disabled={item.disabled || undefined}
          className={cn(
            'flex items-center justify-center cursor-pointer h-[28px] sm:h-[30px] px-2 sm:px-5 flex-1 rounded-3xl transition-all duration-400 text-xs sm:text-sm',
            {
              'bg-white shadow': item.value === selectedValue,
              'text-gray-400 opacity-50 pointer-events-none': item.disabled,
            },
          )}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
