'use client';

import {
  deleteCategory,
  deleteIngredient,
  deleteOrder,
  deleteProduct,
  deleteProductItem,
  deleteUser,
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import React from 'react';

interface Props {
  id: number;
  type: 'user' | 'category' | 'product' | 'ingredient' | 'product-items' | 'order';
  className?: string;
}

export const DeleteButton: React.FC<Props> = ({ id, type, className }) => {
  const [confirming, setConfirming] = React.useState(false);

  const onClickRemove = async () => {
    if (type === 'user') {
      await deleteUser(id);
    } else if (type === 'category') {
      await deleteCategory(id);
    } else if (type === 'product') {
      await deleteProduct(id);
    } else if (type === 'ingredient') {
      await deleteIngredient(id);
    } else if (type === 'product-items') {
      await deleteProductItem(id);
    } else if (type === 'order') {
      await deleteOrder(id);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button
          data-testid={`confirm-delete`}
          onClick={onClickRemove}
          className="w-auto h-8 px-3 text-xs text-white bg-red-600 hover:bg-red-700">
          Delete
        </Button>
        <Button
          variant="outline"
          onClick={() => setConfirming(false)}
          className="w-auto h-8 px-3 text-xs">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      data-testid={`delete-${id}`}
      onClick={() => setConfirming(true)}
      className={`w-10 h-10 p-0 ${className ?? ''}`}>
      <Trash2 size={16} />
    </Button>
  );
};
