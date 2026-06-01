import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChoosePizza } from '@/hooks/use-choose-pizza';
import { useCart } from '@/hooks/use-cart';

vi.mock('@/hooks/use-cart', () => ({
  useCart: vi.fn(() => ({
    addCartItem: vi.fn(),
    loading: false,
  })),
}));

vi.mock('@/lib/pizza-details-to-text', () => ({
  pizzaSizes: [
    { name: 'Small', value: '25' },
    { name: 'Medium', value: '30' },
    { name: 'Large', value: '35' },
  ],
  pizzaDetailsToText: vi.fn(() => 'Medium, Traditional'),
}));

const mockItems = [
  { id: 1, price: 599, size: 25, pizzaType: 1, productId: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, price: 899, size: 30, pizzaType: 1, productId: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, price: 799, size: 25, pizzaType: 2, productId: 1, createdAt: new Date(), updatedAt: new Date() },
];

describe('useChoosePizza', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes size and type from first item', () => {
    const { result } = renderHook(() => useChoosePizza(mockItems));
    expect(result.current.size).toBe(25);
    expect(result.current.type).toBe(1);
  });

  it('marks sizes as disabled when not available for selected type', () => {
    const { result } = renderHook(() => useChoosePizza(mockItems));
    const sizes = result.current.availablePizzaSizes;

    const small = sizes.find((s) => s.value === '25');
    const medium = sizes.find((s) => s.value === '30');
    const large = sizes.find((s) => s.value === '35');

    expect(small?.disabled).toBe(false);
    expect(medium?.disabled).toBe(false);
    expect(large?.disabled).toBe(true);
  });

  it('toggles ingredient selection on/off', () => {
    const { result } = renderHook(() => useChoosePizza(mockItems));

    expect(result.current.isSelectedIngredient(1)).toBe(false);

    act(() => { result.current.toggleAddIngredient(1); });
    expect(result.current.isSelectedIngredient(1)).toBe(true);

    act(() => { result.current.toggleAddIngredient(1); });
    expect(result.current.isSelectedIngredient(1)).toBe(false);
  });

  it('calls addCartItem with correct payload on addPizza', async () => {
    const mockAddCartItem = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useCart).mockReturnValue({ addCartItem: mockAddCartItem, loading: false } as any);

    const { result } = renderHook(() => useChoosePizza(mockItems));

    act(() => { result.current.toggleAddIngredient(5); });
    await act(async () => { await result.current.addPizza(); });

    expect(mockAddCartItem).toHaveBeenCalledWith({
      productItemId: 1,
      pizzaSize: 25,
      type: 1,
      ingredientsIds: [5],
      quantity: 1,
    });
  });

  // DDT: size/type matrix
  const sizeCases = [
    { type: 1, expectedAvailableSizes: ['25', '30'] },
    { type: 2, expectedAvailableSizes: ['25'] },
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
