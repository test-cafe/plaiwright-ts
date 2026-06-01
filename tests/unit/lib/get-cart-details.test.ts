import { describe, it, expect } from 'vitest';
import { getCartDetails } from '@/lib/get-cart-details';
import type { CartResponse } from '@/services/dto/cart';

const mockCartItem = (overrides: Partial<any> = {}) => ({
  id: 1,
  quantity: 1,
  pizzaSize: 30,
  type: 1,
  cartId: 1,
  productItemId: 1,
  userId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  productItem: {
    id: 1,
    price: 599,
    size: 30,
    pizzaType: 1,
    productId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 1,
      name: 'Pepperoni',
      imageUrl: 'https://example.com/pepperoni.png',
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  ingredients: [],
  ...overrides,
});

describe('getCartDetails', () => {
  it('returns empty state for null input', () => {
    expect(getCartDetails(null)).toEqual({ items: [], totalAmount: 0 });
  });

  it('returns empty state for cart with no items array', () => {
    expect(getCartDetails({ items: null as any, totalAmount: 0 } as any)).toEqual({
      items: [],
      totalAmount: 0,
    });
  });

  it('maps a cart item to ICartItem shape', () => {
    const data = {
      totalAmount: 599,
      items: [mockCartItem()],
    } as unknown as CartResponse;

    const { items, totalAmount } = getCartDetails(data);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 1,
      quantity: 1,
      name: 'Pepperoni',
      imageUrl: 'https://example.com/pepperoni.png',
      price: 599,
      pizzaSize: 30,
      type: 1,
      ingredients: [],
    });
    expect(totalAmount).toBe(599);
  });

  it('includes ingredient names and prices in mapped item', () => {
    const item = mockCartItem({
      ingredients: [
        { id: 1, name: 'Extra Cheese', price: 100, imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    const { items } = getCartDetails({ totalAmount: 699, items: [item] } as unknown as CartResponse);

    expect(items[0].ingredients).toEqual([{ name: 'Extra Cheese', price: 100 }]);
    expect(items[0].price).toBeCloseTo(699, 2);
  });

  it('falls back to 0 totalAmount when cart totalAmount is falsy', () => {
    const data = { totalAmount: 0, items: [] } as unknown as CartResponse;
    expect(getCartDetails(data).totalAmount).toBe(0);
  });
});
