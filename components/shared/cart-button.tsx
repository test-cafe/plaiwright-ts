import React from 'react';
import { CartDrawer } from './cart-drawer';
import { Button } from '../ui/button';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { cn, formatMoney } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';

interface Props {
  className?: string;
  compact?: boolean;
}

export const CartButton: React.FC<Props> = ({ className, compact }) => {
  const { totalAmount, items, loading } = useCart();

  if (compact) {
    return (
      <CartDrawer>
        <button
          data-testid="cart-button"
          aria-label={`Cart, ${items.length} items`}
          className={cn('relative p-2 rounded-lg hover:bg-gray-100 transition-colors', className)}>
          <ShoppingCart className="w-6 h-6 text-gray-700" strokeWidth={2} />
          {items.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
              {items.length}
            </span>
          )}
        </button>
      </CartDrawer>
    );
  }

  return (
    <CartDrawer>
      <Button
        loading={loading}
        data-testid="cart-button"
        aria-label={`Cart, ${items.length} items`}
        className={cn('group relative', { 'w-[105px]': loading }, className)}>
        <b>{formatMoney(totalAmount)}</b>
        <span className="h-full w-[1px] bg-white/30 mx-3" />
        <div className="flex items-center gap-1 transition duration-300 group-hover:opacity-0">
          <ShoppingCart className="h-4 w-4 relative" strokeWidth={2} />
          <b>{items.length}</b>
        </div>
        <ArrowRight className="w-5 absolute right-5 transition duration-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
      </Button>
    </CartDrawer>
  );
};
