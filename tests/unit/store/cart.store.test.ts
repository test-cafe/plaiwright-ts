import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { Api } from '@/services/api-client';
import { useCartStore } from '@/store/cart';

vi.mock('@/services/api-client', () => ({
  Api: {
    cart: {
      fetchCart: vi.fn(),
      addCartItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeCartItem: vi.fn(),
    },
  },
}));

vi.mock('@/lib/get-cart-details', () => ({
  getCartDetails: vi.fn((data) => ({
    items: data?.items ?? [],
    totalAmount: data?.totalAmount ?? 0,
  })),
}));

const mockCartResponse = {
  totalAmount: 699,
  items: [{ id: 1, quantity: 1 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [], totalAmount: 0, loading: false, error: false });
});

describe('useCartStore', () => {
  describe('fetchCartItems', () => {
    it('sets loading true then false and updates items on success', async () => {
      vi.mocked(Api.cart.fetchCart).mockResolvedValue(mockCartResponse as any);

      await act(async () => {
        await useCartStore.getState().fetchCartItems();
      });

      const { loading, error, totalAmount } = useCartStore.getState();
      expect(loading).toBe(false);
      expect(error).toBe(false);
      expect(totalAmount).toBe(699);
    });

    it('sets error true on API failure', async () => {
      vi.mocked(Api.cart.fetchCart).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useCartStore.getState().fetchCartItems();
      });

      expect(useCartStore.getState().error).toBe(true);
      expect(useCartStore.getState().loading).toBe(false);
    });
  });

  describe('addCartItem', () => {
    it('calls addCartItem then refetches cart', async () => {
      vi.mocked(Api.cart.addCartItem).mockResolvedValue({} as any);
      vi.mocked(Api.cart.fetchCart).mockResolvedValue(mockCartResponse as any);

      await act(async () => {
        await useCartStore.getState().addCartItem({ productItemId: 1, quantity: 1 });
      });

      expect(Api.cart.addCartItem).toHaveBeenCalledWith({ productItemId: 1, quantity: 1 });
      expect(Api.cart.fetchCart).toHaveBeenCalledOnce();
    });

    it('sets error and rethrows on failure', async () => {
      const error = new Error('Add failed');
      vi.mocked(Api.cart.addCartItem).mockRejectedValue(error);

      await expect(
        act(async () => {
          await useCartStore.getState().addCartItem({ productItemId: 1, quantity: 1 });
        }),
      ).rejects.toThrow('Add failed');

      expect(useCartStore.getState().error).toBe(true);
    });
  });

  describe('updateItemQuantity', () => {
    it('calls updateItemQuantity with id and quantity then refetches', async () => {
      vi.mocked(Api.cart.updateItemQuantity).mockResolvedValue({} as any);
      vi.mocked(Api.cart.fetchCart).mockResolvedValue(mockCartResponse as any);

      await act(async () => {
        await useCartStore.getState().updateItemQuantity(5, 3);
      });

      expect(Api.cart.updateItemQuantity).toHaveBeenCalledWith(5, 3);
      expect(Api.cart.fetchCart).toHaveBeenCalledOnce();
    });
  });

  describe('removeCartItem', () => {
    it('calls removeCartItem with id then refetches', async () => {
      vi.mocked(Api.cart.removeCartItem).mockResolvedValue({} as any);
      vi.mocked(Api.cart.fetchCart).mockResolvedValue({ totalAmount: 0, items: [] } as any);

      await act(async () => {
        await useCartStore.getState().removeCartItem(7);
      });

      expect(Api.cart.removeCartItem).toHaveBeenCalledWith(7);
    });
  });
});
