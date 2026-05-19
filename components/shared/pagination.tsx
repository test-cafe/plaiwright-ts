'use client';

import React from 'react';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}

interface Props {
  className?: string;
  currentPage?: number;
  pageCount?: number;
}

export const Pagination: React.FC<Props> = ({ className, currentPage = 1, pageCount = 1 }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
  };

  const pages = getPageRange(currentPage, pageCount);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        className="p-0 w-10 disabled:bg-white disabled:opacity-20"
        variant="outline"
        disabled={currentPage === 1}
        aria-label="Previous page"
        onClick={() => navigateTo(currentPage - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex gap-1 mx-2">
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-gray-400 select-none">
              …
            </span>
          ) : (
            <Button key={page} variant={currentPage === page ? 'default' : 'ghost'} onClick={() => navigateTo(page)}>
              {page}
            </Button>
          ),
        )}
      </div>

      <Button
        className="p-0 w-10 disabled:bg-white disabled:opacity-20"
        variant="outline"
        disabled={currentPage === pageCount}
        aria-label="Next page"
        onClick={() => navigateTo(currentPage + 1)}>
        <ChevronLeft className="h-4 w-4 rotate-180" />
      </Button>
    </div>
  );
};
