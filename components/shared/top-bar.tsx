import { cn } from '@/lib/utils';
import React from 'react';
import { Container } from './container';
import { Categories } from './categories';
import { SortPopup } from './sort-popup';
import { MobileFilters } from './mobile-filters';
import { Category } from '@prisma/client';

interface Props {
  categories: Category[];
  className?: string;
}

export const TopBar: React.FC<Props> = ({ categories, className }) => {
  return (
    <div className={cn('sticky top-0 bg-white py-5 shadow-lg shadow-black/5 z-10', className)}>
      <Container className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Categories items={categories} />
        <div className="flex items-center gap-2">
          <MobileFilters />
          <SortPopup />
        </div>
      </Container>
    </div>
  );
};
