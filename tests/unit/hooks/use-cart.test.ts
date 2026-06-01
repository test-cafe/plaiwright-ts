import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from '@/hooks/use-cart';
import { useCartStore } from '@/store/cart';

vi.mock('@/store/cart', () => ({
  useCartStore: vi.fn(),
}));

vi.mock('lodash.debounce', () => ({
  default: (fn: (...args: any[]) => any) => fn,
}));

const mockStore = {
  totalAmount: 699,
  items: [{ id: 1, name: 'Pepperoni', quantity: 1, price: 699, imageUrl: '', ingredients: [] }],
  loading: false,
  fetchCartItems: vi.fn(),
  addCartItem: vi.fn(),
  updateItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCartStore).mockImplementation((selector: any) => selector(mockStore));
});

describe('useCart', () => {
  it('returns cart state from store', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.totalAmount).toBe(699);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch cart on mount when runFetch is not set', () => {
    renderHook(() => useCart());
    expect(mockStore.fetchCartItems).not.toHaveBeenCalled();
  });

  it('fetches cart on mount when runFetch is true', async () => {
    renderHook(() => useCart(true));

    await waitFor(() => {
      expect(mockStore.fetchCartItems).toHaveBeenCalledOnce();
    });
  });

  it('exposes updateItemQuantity (debounced in real usage)', () => {
    const { result } = renderHook(() => useCart());
    expect(typeof result.current.updateItemQuantity).toBe('function');
  });
});
