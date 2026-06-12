import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { GET } from '@/app/api/ingredients/route';
import { prisma } from '@/lib/prisma';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { buildIngredientRecord } from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    ingredient: {
      findMany: vi.fn(),
    },
  },
}));

const CHEESE_ID = 1;
const CHEESE_NAME = 'Cheese';
const CHEESE_PRICE = 50;
const MUSHROOMS_ID = 2;
const MUSHROOMS_NAME = 'Mushrooms';
const MUSHROOMS_PRICE = 30;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.ingredient.findMany).mockResolvedValue([]);
});

describe('GET /api/ingredients', () => {
  describe('when no ingredients exist', () => {
    it('returns an empty array', async () => {
      const response = await GET();

      const body = await assertOkResponse(response, z.array(schemas.ingredient));
      expect(body).toHaveLength(0);
    });
  });

  describe('when ingredients exist', () => {
    beforeEach(() => {
      vi.mocked(prisma.ingredient.findMany).mockResolvedValue([
        buildIngredientRecord({ id: CHEESE_ID, name: CHEESE_NAME, price: CHEESE_PRICE }),
        buildIngredientRecord({ id: MUSHROOMS_ID, name: MUSHROOMS_NAME, price: MUSHROOMS_PRICE }),
      ]);
    });

    it('returns every ingredient row with the expected shape', async () => {
      const response = await GET();

      const body = await assertOkResponse(response, z.array(schemas.ingredient));
      expect(body).toEqual([
        expect.objectContaining({ id: CHEESE_ID, name: CHEESE_NAME, price: CHEESE_PRICE }),
        expect.objectContaining({ id: MUSHROOMS_ID, name: MUSHROOMS_NAME, price: MUSHROOMS_PRICE }),
      ]);
    });
  });

  describe('query shape', () => {
    it('calls findMany with no filters or includes', async () => {
      await GET();

      expect(prisma.ingredient.findMany).toHaveBeenCalledWith();
    });
  });
});
