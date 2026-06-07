import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { Api } from '@/services/api-client';
import { useCartStore } from '@/store/cart';
import type { CartResponse } from '@/services/dto/cart';

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

const CART_TOTAL = 699;
const PRODUCT_ITEM_ID = 1;
const ITEM_ID_TO_UPDATE = 5;
const NEW_QUANTITY = 3;
const ITEM_ID_TO_REMOVE = 7;

const MOCK_CART = {
  totalAmount: CART_TOTAL,
  items: [{ id: PRODUCT_ITEM_ID, quantity: 1 }],
} as unknown as CartResponse;

const EMPTY_CART = {
  totalAmount: 0,
  items: [],
} as unknown as CartResponse;

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [], totalAmount: 0, loading: false, error: false });
});

describe('useCartStore', () => {
  describe('fetchCartItems', () => {
    it('loads cart items from the server', async () => {
      vi.mocked(Api.cart.fetchCart).mockResolvedValue(MOCK_CART);

      await act(async () => {
        await useCartStore.getState().fetchCartItems();
      });

      const { loading, error, totalAmount } = useCartStore.getState();
      expect(loading).toBe(false);
      expect(error).toBe(false);
      expect(totalAmount).toBe(CART_TOTAL);
    });

    it('marks the store as errored when the server fails', async () => {
      vi.mocked(Api.cart.fetchCart).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useCartStore.getState().fetchCartItems();
      });

      expect(useCartStore.getState().error).toBe(true);
      expect(useCartStore.getState().loading).toBe(false);
    });
  });

  describe('addCartItem', () => {
    it('adds item to the cart and syncs store state', async () => {
      vi.mocked(Api.cart.addCartItem).mockResolvedValue(MOCK_CART);
      vi.mocked(Api.cart.fetchCart).mockResolvedValue(MOCK_CART);

      await act(async () => {
        await useCartStore.getState().addCartItem({ productItemId: PRODUCT_ITEM_ID, quantity: 1 });
      });

      expect(Api.cart.addCartItem).toHaveBeenCalledWith({ productItemId: PRODUCT_ITEM_ID, quantity: 1 });
      expect(Api.cart.fetchCart).toHaveBeenCalledOnce();
    });

    it('marks the store as errored and rethrows when adding fails', async () => {
      const error = new Error('Add failed');
      vi.mocked(Api.cart.addCartItem).mockRejectedValue(error);

      await expect(
        act(async () => {
          await useCartStore.getState().addCartItem({ productItemId: PRODUCT_ITEM_ID, quantity: 1 });
        }),
      ).rejects.toThrow('Add failed');

      expect(useCartStore.getState().error).toBe(true);
    });
  });

  describe('updateItemQuantity', () => {
    it('updates item quantity and syncs store state', async () => {
      vi.mocked(Api.cart.updateItemQuantity).mockResolvedValue(MOCK_CART);
      vi.mocked(Api.cart.fetchCart).mockResolvedValue(MOCK_CART);

      await act(async () => {
        await useCartStore.getState().updateItemQuantity(ITEM_ID_TO_UPDATE, NEW_QUANTITY);
      });

      expect(Api.cart.updateItemQuantity).toHaveBeenCalledWith(ITEM_ID_TO_UPDATE, NEW_QUANTITY);
      expect(Api.cart.fetchCart).toHaveBeenCalledOnce();
    });
  });

  describe('removeCartItem', () => {
    it('removes item from the cart and syncs store state', async () => {
      vi.mocked(Api.cart.removeCartItem).mockResolvedValue(EMPTY_CART);
      vi.mocked(Api.cart.fetchCart).mockResolvedValue(EMPTY_CART);

      await act(async () => {
        await useCartStore.getState().removeCartItem(ITEM_ID_TO_REMOVE);
      });

      expect(Api.cart.removeCartItem).toHaveBeenCalledWith(ITEM_ID_TO_REMOVE);
      expect(Api.cart.fetchCart).toHaveBeenCalledOnce();
    });
  });
});
