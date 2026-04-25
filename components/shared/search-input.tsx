'use client';

import { cn } from '@/lib/utils';
import { Api } from '@/services/api-client';
import { Product } from '@prisma/client';
import { Search } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useClickAway, useDebounce } from 'react-use';

export const SearchInput = () => {
  const [focused, setFocused] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const ref = React.useRef(null);

  useClickAway(ref, () => {
    setFocused(false);
  });

  useDebounce(
    async () => {
      const products = await Api.products.search(searchQuery);
      setProducts(products);
    },
    100,
    [searchQuery],
  );

  const onClickItem = () => {
    setProducts([]);
    setSearchQuery('');
    setFocused(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!products.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const product = products[activeIndex];
      window.location.href = `/product/${product.id}`;
      onClickItem();
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <>
      {focused && <div className="fixed top-0 left-0 bottom-0 right-0 bg-black/50 z-30" />}
      <div
        ref={ref}
        className={cn('flex rounded-2xl flex-1 justify-between relative h-11', focused && 'z-30')}>
        <Search className="absolute top-1/2 translate-y-[-50%] left-3 h-5 text-gray-400" />

        <input
          data-testid="search-input"
          className="rounded-2xl outline-none w-full bg-gray-50 pl-11"
          type="text"
          placeholder="Search for pizza..."
          onFocus={() => setFocused(true)}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setActiveIndex(-1); }}
          onKeyDown={onKeyDown}
        />

        {products.length > 0 && (
          <div
            data-testid="search-results"
            className={cn(
              'absolute w-full bg-white rounded-xl py-2 top-14 shadow-md transition-all duration-200 invisible opacity-0 z-30',
              focused && 'visible opacity-100 top-12',
            )}>
            {products.map((product, index) => (
              <Link
                href={`/product/${product.id}`}
                key={product.id}
                onClick={onClickItem}
                className={cn('block px-3 py-2 hover:bg-primary/10 cursor-pointer', activeIndex === index && 'bg-primary/10')}
              >
                {product.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
