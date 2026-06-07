import type { Ingredient, ProductItem } from '@prisma/client';

type Item = {
  productItem: Pick<ProductItem, 'price'>;
  ingredients: Pick<Ingredient, 'price'>[];
  quantity: number;
};

export const calcCartItemTotalAmount = (item: Item): number => {
  return (
    (item.productItem.price +
      item.ingredients.reduce((acc, ingredient) => acc + ingredient.price, 0)) *
    item.quantity
  );
};
