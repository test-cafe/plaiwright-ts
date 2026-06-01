import type { CreateCartItemValues } from '@/services/dto/cart';

export const validCartItem = (productItemId: number): CreateCartItemValues => ({
  productItemId,
  pizzaSize: 30,
  type: 1,
  ingredientsIds: [],
  quantity: 1,
});

export const cartItemWithIngredients = (
  productItemId: number,
  ingredientIds: number[],
): CreateCartItemValues => ({
  productItemId,
  pizzaSize: 30,
  type: 1,
  ingredientsIds: ingredientIds,
  quantity: 1,
});

export const invalidCartPayloads = [
  {
    label: 'missing productItemId',
    body: { pizzaSize: 30, type: 1, quantity: 1 },
    expectedStatus: 400,
  },
  {
    label: 'non-existent productItemId',
    body: { productItemId: 999999, pizzaSize: 30, type: 1, quantity: 1 },
    expectedStatus: 400,
  },
  {
    label: 'zero quantity',
    body: { productItemId: 1, pizzaSize: 30, type: 1, quantity: 0 },
    expectedStatus: 400,
  },
];
