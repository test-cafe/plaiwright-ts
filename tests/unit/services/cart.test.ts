import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axiosInstance } from '@/services/instance';
import { fetchCart, addCartItem, updateItemQuantity, removeCartItem } from '@/services/cart';

vi.mock('@/services/instance', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCartResponse = {
  id: 1,
  totalAmount: 699,
  tokenId: 'test-token',
  userId: null,
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('services/cart', () => {
  describe('fetchCart', () => {
    it('calls GET /cart and returns the response data', async () => {
      vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockCartResponse });

      const result = await fetchCart();

      expect(axiosInstance.get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockCartResponse);
    });
  });

  describe('addCartItem', () => {
    it('calls POST /cart with item values and returns the response data', async () => {
      vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockCartResponse });
      const values = { productItemId: 10, quantity: 1 };

      const result = await addCartItem(values);

      expect(axiosInstance.post).toHaveBeenCalledWith('/cart', values);
      expect(result).toEqual(mockCartResponse);
    });

    it('forwards optional pizza fields to the POST body', async () => {
      vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockCartResponse });
      const values = { productItemId: 10, quantity: 1, pizzaSize: 30, type: 1, ingredientsIds: [3, 5] };

      await addCartItem(values);

      expect(axiosInstance.post).toHaveBeenCalledWith('/cart', values);
    });
  });

  describe('updateItemQuantity', () => {
    it('calls PATCH /cart/{id} with quantity payload and returns the response data', async () => {
      vi.mocked(axiosInstance.patch).mockResolvedValue({ data: mockCartResponse });

      const result = await updateItemQuantity(7, 3);

      expect(axiosInstance.patch).toHaveBeenCalledWith('/cart/7', { quantity: 3 });
      expect(result).toEqual(mockCartResponse);
    });
  });

  describe('removeCartItem', () => {
    it('calls DELETE /cart/{id} and returns the response data', async () => {
      vi.mocked(axiosInstance.delete).mockResolvedValue({ data: mockCartResponse });

      const result = await removeCartItem(7);

      expect(axiosInstance.delete).toHaveBeenCalledWith('/cart/7');
      expect(result).toEqual(mockCartResponse);
    });
  });
});
