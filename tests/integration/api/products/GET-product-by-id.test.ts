import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/products/[id]/route';
import { prisma } from '@/lib/prisma';
import { request } from '@/tests/helpers/api-builder';
import { urls } from '@/tests/helpers/url-builder';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { buildProductRecord } from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
    },
  },
}));

const PRODUCT_ID = 1;
const MISSING_PRODUCT_ID = 999;
const OTHER_PRODUCT_ID = 7;
const PRODUCT_ITEM_ID = 100;
const PRODUCT_ITEM_PRICE = 599;
const INGREDIENT_ID = 10;
const INGREDIENT_PRICE = 50;
const PIZZA_SIZE = 30;
const PIZZA_TYPE = 1;

const margheritaProduct = buildProductRecord({
  id: PRODUCT_ID,
  ingredients: [
    {
      id: INGREDIENT_ID,
      name: 'Cheese',
      price: INGREDIENT_PRICE,
      imageUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  items: [
    {
      id: PRODUCT_ITEM_ID,
      productId: PRODUCT_ID,
      price: PRODUCT_ITEM_PRICE,
      size: PIZZA_SIZE,
      pizzaType: PIZZA_TYPE,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: PRODUCT_ID,
        name: 'Margherita',
        imageUrl: '',
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      },
    },
  ],
});

const callGet = (id: number) =>
  GET(request.get(urls.product(id)).build(), { params: Promise.resolve({ id: String(id) }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/products/[id]', () => {
  describe('when the product exists', () => {
    beforeEach(() => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(margheritaProduct);
    });

    it('returns the product with ingredients and items', async () => {
      const response = await callGet(PRODUCT_ID);

      await assertOkResponse(response, schemas.product);
    });

    it('queries by the numeric id parsed from the URL segment', async () => {
      await callGet(OTHER_PRODUCT_ID);

      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: OTHER_PRODUCT_ID } }),
      );
    });

    it('includes ingredients and nested items in the query', async () => {
      await callGet(PRODUCT_ID);

      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            ingredients: true,
            items: expect.objectContaining({ include: expect.anything() }),
          }),
        }),
      );
    });
  });

  describe('when the product does not exist', () => {
    it('returns 200 with a null body', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      const response = await callGet(MISSING_PRODUCT_ID);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toBeNull();
    });
  });
});
