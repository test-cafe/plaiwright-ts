import React from 'react';
import { useSet } from 'react-use';
import { Ingredient, Product, ProductItem } from '@prisma/client';

import {
  PizzaSize,
  PizzaSizeItem,
  PizzaType,
  pizzaDetailsToText,
  pizzaSizes,
} from '@/lib/pizza-details-to-text';
import { useCart } from './use-cart';

export type IProduct = Product & { items: ProductItem[]; ingredients: Ingredient[] };

export const useChoosePizza = (items?: IProduct['items']) => {
  const [selectedIngredientsIds, { toggle: toggleAddIngredient }] = useSet<number>(new Set([]));
  const { addCartItem, loading } = useCart();

  const [size, setSize] = React.useState<PizzaSize>(() => (items?.[0]?.size as PizzaSize) ?? 20);
  const [type, setType] = React.useState<PizzaType>(() => (items?.[0]?.pizzaType as PizzaType) ?? 1);

  const activeSizes = items?.filter((item) => item.pizzaType === type).map((item) => item.size);
  const productItem = items?.find((item) => item.pizzaType === type && item.size === Number(size));

  const isActiveSize = (value: number | string) => {
    return activeSizes?.some((activeSize) => activeSize === Number(value));
  };

  const availablePizzaSizes = pizzaSizes.map<PizzaSizeItem>((obj) => ({
    name: obj.name,
    value: obj.value,
    disabled: !isActiveSize(obj.value),
  }));

  // Adjust during render (not in an effect): when the type changes, snap to
  // the first size available for it. prevType starts as null so the same
  // adjustment also applies on the initial render.
  const [prevType, setPrevType] = React.useState<PizzaType | null>(null);
  if (prevType !== type) {
    setPrevType(type);
    const availableSize = availablePizzaSizes.find((item) => !item.disabled);
    if (availableSize) {
      setSize(Number(availableSize.value) as PizzaSize);
    }
  }

  const addPizza = async () => {
    if (productItem) {
      await addCartItem({
        productItemId: productItem?.id,
        pizzaSize: size,
        type,
        ingredientsIds: Array.from(selectedIngredientsIds),
        quantity: 1,
      });
    }
  };

  const setPizzaSize = (value: number | string) => {
    setSize(Number(value) as PizzaSize);
  };

  const setPizzaType = (value: number | string) => {
    setType(Number(value) as PizzaType);
  };

  const isSelectedIngredient = (id: number) => {
    return selectedIngredientsIds.has(id);
  };

  const textDetaills = pizzaDetailsToText(size, type);

  return {
    availablePizzaSizes,
    setPizzaSize,
    setPizzaType,
    isActiveSize,
    textDetaills,
    isSelectedIngredient,
    loading,
    size,
    type,
    addPizza,
    selectedIngredientsIds,
    toggleAddIngredient,
  };
};
