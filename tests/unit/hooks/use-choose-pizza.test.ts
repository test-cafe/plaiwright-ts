import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChoosePizza, IProduct } from '@/hooks/use-choose-pizza';
import { useCart } from '@/hooks/use-cart';

vi.mock('@/hooks/use-cart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/lib/pizza-details-to-text', () => ({
  pizzaSizes: [
    { name: 'Small', value: '25' },
    { name: 'Medium', value: '30' },
    { name: 'Large', value: '35' },
  ],
  pizzaDetailsToText: vi.fn(() => 'Medium, Traditional'),
}));

const SMALL = 25;
const MEDIUM = 30;
const LARGE = 35;
const TRADITIONAL = 1;
const SICILIAN = 2;
const INGREDIENT_ID = 5;

const createMockUseCart = (
  overrides: Partial<ReturnType<typeof useCart>> = {},
): ReturnType<typeof useCart> => ({
  addCartItem: vi.fn(),
  loading: false,
  totalAmount: 0,
  items: [],
  updateItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  ...overrides,
});

const mockItems = [
  { id: 1, price: 599, size: SMALL, pizzaType: TRADITIONAL, productId: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, price: 899, size: MEDIUM, pizzaType: TRADITIONAL, productId: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, price: 799, size: SMALL, pizzaType: SICILIAN, productId: 1, createdAt: new Date(), updatedAt: new Date() },
] as unknown as IProduct['items'];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCart).mockReturnValue(createMockUseCart());
});

describe('useChoosePizza', () => {
  describe('initial state', () => {
    it('sets size from the first item', () => {
      const { result } = renderHook(() => useChoosePizza(mockItems));

      expect(result.current.size).toBe(SMALL);
    });

    it('sets type from the first item', () => {
      const { result } = renderHook(() => useChoosePizza(mockItems));

      expect(result.current.type).toBe(TRADITIONAL);
    });
  });

  describe('available sizes', () => {
    it('disables sizes not available for the selected type', () => {
      const { result } = renderHook(() => useChoosePizza(mockItems));

      const sizes = result.current.availablePizzaSizes;
      const small = sizes.find((s) => s.value === String(SMALL));
      const medium = sizes.find((s) => s.value === String(MEDIUM));
      const large = sizes.find((s) => s.value === String(LARGE));

      expect(small?.disabled).toBe(false);
      expect(medium?.disabled).toBe(false);
      expect(large?.disabled).toBe(true);
    });

    const sizeCases = [
      { type: TRADITIONAL, expectedAvailableSizes: [String(SMALL), String(MEDIUM)] },
      { type: SICILIAN, expectedAvailableSizes: [String(SMALL)] },
    ];

    it.each(sizeCases)(
      'type=$type → available sizes=$expectedAvailableSizes',
      ({ type, expectedAvailableSizes }) => {
        const { result } = renderHook(() => useChoosePizza(mockItems));

        act(() => { result.current.setPizzaType(type); });

        const available = result.current.availablePizzaSizes
          .filter((s) => !s.disabled)
          .map((s) => s.value);

        expect(available).toEqual(expect.arrayContaining(expectedAvailableSizes));
      },
    );
  });

  describe('ingredient selection', () => {
    it('toggles an ingredient on and off', () => {
      const { result } = renderHook(() => useChoosePizza(mockItems));

      expect(result.current.isSelectedIngredient(INGREDIENT_ID)).toBe(false);

      act(() => { result.current.toggleAddIngredient(INGREDIENT_ID); });

      expect(result.current.isSelectedIngredient(INGREDIENT_ID)).toBe(true);

      act(() => { result.current.toggleAddIngredient(INGREDIENT_ID); });

      expect(result.current.isSelectedIngredient(INGREDIENT_ID)).toBe(false);
    });
  });

  describe('when submitting to cart', () => {
    let mockAddCartItem: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockAddCartItem = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useCart).mockReturnValue(createMockUseCart({ addCartItem: mockAddCartItem }));
    });

    it('submits pizza with selected ingredients, size, and type', async () => {
      const { result } = renderHook(() => useChoosePizza(mockItems));

      act(() => { result.current.toggleAddIngredient(INGREDIENT_ID); });

      await act(async () => { await result.current.addPizza(); });

      expect(mockAddCartItem).toHaveBeenCalledWith({
        productItemId: 1,
        pizzaSize: SMALL,
        type: TRADITIONAL,
        ingredientsIds: [INGREDIENT_ID],
        quantity: 1,
      });
    });
  });
});
