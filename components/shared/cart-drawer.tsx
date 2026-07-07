'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DrawerCartItem } from './drawer-cart-item';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import React from 'react';
import { Title } from './title';
import clsx from 'clsx';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatMoney } from '@/lib/utils';

export const CartDrawer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [redirecting, setRedirecting] = React.useState(false);

  const { totalAmount, items, loading } = useCart(true);
  const hasItems = items.length > 0;

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent data-testid="cart-drawer" className="flex flex-col justify-between pb-0 bg-[#F4F1EE] sm:max-w-lg">
        <div className={clsx('flex flex-col h-full', !hasItems && 'justify-center')}>
          <SheetHeader className={clsx(!hasItems && 'sr-only')}>
            <SheetTitle data-testid="cart-item-count">
              {hasItems
                ? <>In cart: <span className="font-bold">{items.length} items</span></>
                : 'Shopping Cart'}
            </SheetTitle>
          </SheetHeader>

          {!hasItems && (
            <div data-testid="cart-empty" className="flex flex-col items-center justify-center w-full max-w-[288px] mx-auto">
              <Image src="/assets/images/empty-box.png" alt="Empty cart" width={120} height={120} />
              <Title size="sm" text="Cart is empty" className="text-center font-bold my-2" />
              <p className="text-center text-neutral-500 mb-5">
                Add at least one pizza to place an order
              </p>

              <SheetClose asChild>
                <Button className="w-56 h-12 text-base" size="lg">
                  <ArrowLeft className="w-5 mr-2" />
                  Go back
                </Button>
              </SheetClose>
            </div>
          )}

          {hasItems && (
            <>
              <div className="-mx-6 mt-5 overflow-auto flex-1">
                {items.map((item) => (
                  <div key={item.id} className="mb-2">
                    <DrawerCartItem
                      id={item.id}
                      name={item.name}
                      imageUrl={item.imageUrl}
                      price={item.price}
                      ingredients={item.ingredients}
                      quantity={item.quantity}
                      pizzaSize={item.pizzaSize}
                      type={item.type}
                    />
                  </div>
                ))}
              </div>

              <SheetFooter className="-mx-6 bg-white p-8">
                <div className="w-full">
                  <div className="flex mb-4">
                    <span className="flex flex-1 text-lg text-neutral-500">
                      Total
                      <div className="flex-1 border-b border-dashed border-b-neutral-200 relative -top-1 mx-2" />
                    </span>

                    <span className="font-bold text-lg">{formatMoney(totalAmount)}</span>
                  </div>

                  <Link href="/cart" data-testid="checkout-button">
                    <Button
                      onClick={() => setRedirecting(true)}
                      loading={loading || redirecting}
                      type="submit"
                      className="w-full h-12 text-base">
                      Checkout
                      <ArrowRight className="w-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </SheetFooter>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
