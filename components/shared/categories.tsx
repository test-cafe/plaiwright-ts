'use client';

import { cn } from '@/lib/utils';
import { useCategoryStore } from '@/store/category';
import { Category } from '@prisma/client';
import React from 'react';

interface Props {
  items: Category[];
  className?: string;
}

export const Categories: React.FC<Props> = ({ items, className }) => {
  const activeId = useCategoryStore((state) => state.activeId);
  const setActiveId = useCategoryStore((state) => state.setActiveId);
  const lockFor = useCategoryStore((state) => state.lockFor);
  const itemRefs = React.useRef<Record<number, HTMLAnchorElement | null>>({});

  React.useEffect(() => {
    if (activeId == null) return;
    itemRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId]);

  React.useEffect(() => {
    const firstId = items[0]?.id;
    if (!firstId) return;
    const handleScroll = () => {
      if (window.scrollY < 100) setActiveId(firstId);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  return (
    <div className={cn('relative flex gap-1 bg-gray-50 p-1 rounded-2xl overflow-x-auto max-w-full [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]', className)}>
      {items.map((category) => (
        <a
          key={category.id}
          ref={(el) => { itemRefs.current[category.id] = el; }}
          className={cn(
            'flex items-center font-bold h-9 sm:h-11 rounded-2xl px-3 sm:px-5 text-sm sm:text-base shrink-0 transition-all duration-300 ease-in-out',
            activeId === category.id && 'bg-white shadow-md shadow-gray-200 text-primary',
          )}
          href={`/#${category.name}`}
          onClick={() => { setActiveId(category.id); lockFor(1000); }}>
          {category.name}
        </a>
      ))}
    </div>
  );
};
