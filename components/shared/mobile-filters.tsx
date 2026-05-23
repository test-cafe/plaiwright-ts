'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filters } from './filters';

export const MobileFilters: React.FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[75vh] overflow-y-auto rounded-t-2xl px-6 pb-8 bg-white">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left text-lg font-bold">Filters</SheetTitle>
        </SheetHeader>
        <Filters />
      </SheetContent>
    </Sheet>
  );
};
