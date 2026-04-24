'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRouter, useSearchParams } from 'next/navigation';

const sortItems = [
  { value: 'popular', label: 'Most popular first' },
  { value: 'cheap', label: 'Cheapest first' },
  { value: 'expensive', label: 'Most expensive first' },
  { value: 'rating', label: 'Highest rated' },
];

interface Props {
  className?: string;
}

export const SortPopup: React.FC<Props> = ({ className }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const current = searchParams.get('sortBy') || 'popular';
  const currentLabel = sortItems.find((i) => i.value === current)?.label ?? 'popular';

  const onSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', value);
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-1 bg-gray-50 px-5 h-[52px] rounded-2xl cursor-pointer',
            className,
          )}>
          <ArrowUpDown className="w-4 h-4" />
          <b>Sort:</b>
          <b className="text-primary">{currentLabel}</b>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[240px]">
        <ul>
          {sortItems.map((item) => (
            <li key={item.value}>
              <button
                onClick={() => onSelect(item.value)}
                className={cn(
                  'w-full text-left hover:bg-secondary hover:text-primary p-2 px-4 cursor-pointer rounded-md',
                  current === item.value && 'bg-secondary text-primary font-semibold',
                )}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
