import { describe, it, expect } from 'vitest';
import { calcCartItemTotalAmount } from '@/lib/calc-cart-item-total-amount';

const priceCases = [
  {
    label: 'no ingredients, qty 1',
    productItem: { price: 599 },
    ingredients: [],
    quantity: 1,
    expected: 599,
  },
  {
    label: 'one integer ingredient, qty 1',
    productItem: { price: 599 },
    ingredients: [{ price: 100 }],
    quantity: 1,
    expected: 699,
  },
  {
    label: 'one float ingredient, qty 2',
    productItem: { price: 899 },
    ingredients: [{ price: 50.5 }],
    quantity: 2,
    expected: 1899,
  },
  {
    label: 'multiple ingredients, qty 3',
    productItem: { price: 599 },
    ingredients: [{ price: 100 }, { price: 80 }],
    quantity: 3,
    expected: 2337,
  },
  {
    label: 'zero-price ingredient (free topping)',
    productItem: { price: 1199 },
    ingredients: [{ price: 0 }],
    quantity: 1,
    expected: 1199,
  },
  {
    label: 'small float precision case',
    productItem: { price: 1000 },
    ingredients: [{ price: 0.1 }, { price: 0.2 }],
    quantity: 1,
    expected: 1000.3,
  },
];

describe('calcCartItemTotalAmount', () => {
  it.each(priceCases)(
    '$label → $expected',
    ({ productItem, ingredients, quantity, expected }) => {
      const item = { productItem, ingredients, quantity };

      const result = calcCartItemTotalAmount(item);

      expect(result).toBeCloseTo(expected, 2);
    },
  );

  it('returns 0 for a zero-price item with no ingredients', () => {
    const item = { productItem: { price: 0 }, ingredients: [], quantity: 1 };

    const result = calcCartItemTotalAmount(item);

    expect(result).toBe(0);
  });
});
