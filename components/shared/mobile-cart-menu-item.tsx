'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartDrawer } from './cart-drawer';

export const MobileCartMenuItem: React.FC = () => {
  return (
    <CartDrawer>
      <button className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-secondary transition-colors">
        <ShoppingCart className="w-5 h-5" />
        <span className="font-medium">Cart</span>
      </button>
    </CartDrawer>
  );
};
