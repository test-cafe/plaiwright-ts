import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCart } from '@/hooks/use-cart';
import { useCartStore, type CartState, type ICartItem } from '@/store/cart';

vi.mock('lodash.debounce', () => ({
  default: <T extends (...args: any[]) => any>(fn: T): T => fn,
}));

const TOTAL_AMOUNT = 699;
const NEW_QUANTITY = 2;

const PEPPERONI_ITEM: ICartItem = {
  id: 1,
  name: 'Pepperoni',
  quantity: 1,
  price: TOTAL_AMOUNT,
  imageUrl: '',
  ingredients: [],
};

const buildStoreState = (
  overrides: Partial<CartState> = {},
): Partial<CartState> => ({
  totalAmount: TOTAL_AMOUNT,
  items: [PEPPERONI_ITEM],
  loading: false,
  error: false,
  fetchCartItems: vi.fn<CartState['fetchCartItems']>().mockResolvedValue(undefined),
  addCartItem: vi.fn<CartState['addCartItem']>().mockResolvedValue(undefined),
  updateItemQuantity: vi.fn<CartState['updateItemQuantity']>().mockResolvedValue(undefined),
  removeCartItem: vi.fn<CartState['removeCartItem']>().mockResolvedValue(undefined),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState(buildStoreState());
});

describe('useCart', () => {
  describe('mirrors store state', () => {
    it('exposes totalAmount from the store', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.totalAmount).toBe(TOTAL_AMOUNT);
    });

    it('exposes items from the store', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.items).toEqual([PEPPERONI_ITEM]);
    });

    it('exposes the loading flag from the store', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('mount-time fetch', () => {
    it('does not call fetchCartItems when runFetch is omitted', () => {
      const fetchSpy = vi.fn<CartState['fetchCartItems']>().mockResolvedValue(undefined);
      useCartStore.setState({ fetchCartItems: fetchSpy });

      renderHook(() => useCart());

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('calls fetchCartItems once when runFetch is true', async () => {
      const fetchSpy = vi.fn<CartState['fetchCartItems']>().mockResolvedValue(undefined);
      useCartStore.setState({ fetchCartItems: fetchSpy });

      renderHook(() => useCart(true));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledOnce();
      });
    });
  });

  describe('action delegation', () => {
    it('forwards updateItemQuantity arguments to the store action', () => {
      const updateSpy = vi.fn<CartState['updateItemQuantity']>().mockResolvedValue(undefined);
      useCartStore.setState({ updateItemQuantity: updateSpy });

      const { result } = renderHook(() => useCart());
      result.current.updateItemQuantity(PEPPERONI_ITEM.id, NEW_QUANTITY);

      expect(updateSpy).toHaveBeenCalledWith(PEPPERONI_ITEM.id, NEW_QUANTITY);
    });
  });
});
