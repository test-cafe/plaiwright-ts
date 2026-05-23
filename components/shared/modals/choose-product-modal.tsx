'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { ChoosePizzaForm } from '../choose-pizza-form';
import { IProduct } from '@/hooks/use-choose-pizza';
import { useRouter } from 'next/navigation';
import { ChooseProductForm } from '../choose-product-form';

interface Props {
  product: IProduct;
}

export const ChooseProductModal: React.FC<Props> = ({ product }) => {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const isPizzaForm = Boolean(product.items[0].pizzaType);

  const onCloseModal = () => {
    setOpen(false);
    React.startTransition(() => {
      router.back();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onCloseModal}>
      <DialogContent className="p-0 w-full max-w-[1060px] min-h-[500px] bg-white overflow-hidden flex">
        <VisuallyHidden.Root>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Choose your pizza options</DialogDescription>
        </VisuallyHidden.Root>
        {isPizzaForm ? (
          <ChoosePizzaForm
            imageUrl={product.imageUrl}
            name={product.name}
            items={product.items}
            onClickAdd={onCloseModal}
            ingredients={product.ingredients}
          />
        ) : (
          <ChooseProductForm
            imageUrl={product.imageUrl}
            name={product.name}
            items={product.items}
            onClickAdd={onCloseModal}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
