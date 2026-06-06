import { describe, it, expect } from 'vitest';
import { pizzaDetailsToText } from '@/lib/pizza-details-to-text';

describe('pizzaDetailsToText', () => {
  it('formats a small traditional pizza', () => {
    expect(pizzaDetailsToText(20, 1)).toBe('20 sm (small), traditional dough');
  });

  it('formats a small thin pizza', () => {
    expect(pizzaDetailsToText(20, 2)).toBe('20 sm (small), thin dough');
  });

  it('formats a medium thin pizza', () => {
    expect(pizzaDetailsToText(30, 2)).toBe('30 sm (medium), thin dough');
  });

  it('formats a medium traditional pizza', () => {
    expect(pizzaDetailsToText(30, 1)).toBe('30 sm (medium), traditional dough');
  });

  it('formats a large traditional pizza', () => {
    expect(pizzaDetailsToText(40, 1)).toBe('40 sm (large), traditional dough');
  });

  it('formats a large thin pizza', () => {
    expect(pizzaDetailsToText(40, 2)).toBe('40 sm (large), thin dough');
  });
});
