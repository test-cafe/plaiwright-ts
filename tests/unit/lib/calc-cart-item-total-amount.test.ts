import { describe, it, expect } from 'vitest';
import { calcCartItemTotalAmount } from '@/lib/calc-cart-item-total-amount';

// DDT: covers Int base price + Float ingredient prices + various quantities
const priceCases = [
  {
    label: 'no ingredients, qty 1',
    basePrice: 599,
    ingredients: [],
    quantity: 1,
    expected: 599,
  },
  {
    label: 'one integer ingredient, qty 1',
    basePrice: 599,
    ingredients: [{ price: 100 }],
    quantity: 1,
    expected: 699,
  },
  {
    label: 'one float ingredient, qty 2',
    basePrice: 899,
    ingredients: [{ price: 50.5 }],
    quantity: 2,
    expected: 1899,
  },
  {
    label: 'multiple ingredients, qty 3',
    basePrice: 599,
    ingredients: [{ price: 100 }, { price: 80 }],
    quantity: 3,
    expected: 2337,
  },
  {
    label: 'zero-price ingredient (free topping)',
    basePrice: 1199,
    ingredients: [{ price: 0 }],
    quantity: 1,
    expected: 1199,
  },
  {
    label: 'small float precision case',
    basePrice: 1000,
    ingredients: [{ price: 0.1 }, { price: 0.2 }],
    quantity: 1,
    expected: 1000.3,
  },
];

describe('calcCartItemTotalAmount', () => {
  it.each(priceCases)(
    '$label → $expected',
    ({ basePrice, ingredients, quantity, expected }) => {
      const item = {
        productItem: {
          price: basePrice,
        } as any,
        ingredients: ingredients.map((ing) => ({ price: ing.price } as any)),
        quantity,
      };

      const result = calcCartItemTotalAmount(item);

      expect(result).toBeCloseTo(expected, 2);
    },
  );

  it('handles single item with no ingredients', () => {
    const item = {
      productItem: { price: 0 } as any,
      ingredients: [],
      quantity: 1,
    };
    expect(calcCartItemTotalAmount(item)).toBe(0);
  });
});
