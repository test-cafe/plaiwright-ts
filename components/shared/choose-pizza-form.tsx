'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { PizzaImage } from './pizza-image';
import { IngredientsList } from './ingredients-list';
import { Button } from '../ui/button';
import { Title } from './title';
import { PizzaSelector } from './pizza-selector';
import { IProduct, useChoosePizza } from '@/hooks/use-choose-pizza';
import toast from 'react-hot-toast';

interface Props {
  imageUrl: string;
  name: string;
  className?: string;
  ingredients: IProduct['ingredients'];
  items?: IProduct['items'];
  onClickAdd?: VoidFunction;
}

export const ChoosePizzaForm: React.FC<Props> = ({
  name,
  items,
  imageUrl,
  ingredients,
  onClickAdd,
  className,
}) => {
  const {
    size,
    type,
    availablePizzaSizes,
    setPizzaSize,
    setPizzaType,
    textDetaills,
    loading,
    addPizza,
    selectedIngredientsIds,
    toggleAddIngredient,
  } = useChoosePizza(items);

  const totalIngredientPrice: number =
    ingredients
      ?.filter((ingredient) => selectedIngredientsIds.has(ingredient.id))
      ?.reduce((acc, item) => acc + item.price, 0) || 0;

  const pizzaPrice: number = items?.find((item) => item.pizzaType === type && item.size === size)?.price || 0;
  const totalPrice: number = totalIngredientPrice + pizzaPrice;

  const handleClickAdd = async () => {
    try {
      await addPizza();
      toast.success('Item added to cart');
      onClickAdd?.();
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className={cn(className, 'flex flex-col md:flex-row flex-1')}>
      <PizzaImage imageUrl={imageUrl} size={size} />

      <div className="w-full md:w-[490px] bg-[#FCFCFC] p-4 md:p-7">
        <Title text={name} size="md" className="font-extrabold mb-1" />

        <p className="text-gray-600">{textDetaills}</p>

        <PizzaSelector
          pizzaSizes={availablePizzaSizes}
          selectedSize={String(size)}
          selectedPizzaType={String(type)}
          onClickSize={setPizzaSize}
          onClickPizzaType={setPizzaType}
        />

        <div className="bg-gray-50 p-5 rounded-md h-[300px] md:h-[420px] overflow-auto scrollbar">
          <IngredientsList
            ingredients={ingredients}
            onClickAdd={toggleAddIngredient}
            selectedIds={selectedIngredientsIds}
          />
        </div>

        <p data-testid="product-price" className="sr-only">${totalPrice}</p>

        <Button
          loading={loading}
          onClick={handleClickAdd}
          data-testid="add-to-cart"
          className="h-[55px] px-10 text-base rounded-[18px] w-full">
          Add to cart for ${totalPrice}
        </Button>
      </div>
    </div>
  );
};
