import { expect } from 'vitest';

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        `expected ${received} to be within range [${floor}, ${ceiling}]`,
    };
  },

  toMatchPrice(received: number, expected: number, tolerance = 0.001) {
    const pass = Math.abs(received - expected) <= tolerance;
    return {
      pass,
      message: () =>
        `expected price ${received} to equal ${expected} (tolerance: ${tolerance})`,
    };
  },
});

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
    toMatchPrice(expected: number, tolerance?: number): T;
  }
}
