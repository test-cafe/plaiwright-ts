import { describe, it, expect } from 'vitest';
import { getCartDetails } from '@/lib/get-cart-details';
import type { CartDetailsInput, CartDetailsItem } from '@/lib/get-cart-details';

const BASE_ITEM: CartDetailsItem = {
  id: 1,
  quantity: 1,
  pizzaSize: 30,
  type: 1,
  productItem: {
    price: 599,
    product: { name: 'Pepperoni', imageUrl: 'https://example.com/pepperoni.png' },
  },
  ingredients: [],
};

const mockCartItem = (overrides: Partial<CartDetailsItem> = {}): CartDetailsItem => ({
  ...BASE_ITEM,
  ...overrides,
});

describe('getCartDetails', () => {
  it('returns empty state for null input', () => {
    const result = getCartDetails(null);

    expect(result).toEqual({ items: [], totalAmount: 0 });
  });

  it('returns empty state for cart with no items array', () => {
    const malformed = { totalAmount: 0, items: null } as unknown as CartDetailsInput;

    const result = getCartDetails(malformed);

    expect(result).toEqual({ items: [], totalAmount: 0 });
  });

  it('maps a cart item to ICartItem shape', () => {
    const data: CartDetailsInput = { totalAmount: 599, items: [mockCartItem()] };

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
    const item = mockCartItem({ ingredients: [{ name: 'Extra Cheese', price: 100 }] });
    const data: CartDetailsInput = { totalAmount: 699, items: [item] };

    const { items } = getCartDetails(data);

    expect(items[0].ingredients).toEqual([{ name: 'Extra Cheese', price: 100 }]);
    expect(items[0].price).toBeCloseTo(699, 2);
  });

  it('falls back to 0 totalAmount when cart totalAmount is falsy', () => {
    const data: CartDetailsInput = { totalAmount: 0, items: [] };

    const result = getCartDetails(data);

    expect(result.totalAmount).toBe(0);
  });
});
