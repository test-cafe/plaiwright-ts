import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/ingredients/route';
import { assertOkResponse } from '@/tests/helpers/response-validator';
import { z } from 'zod';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    ingredient: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const ingredientSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    imageUrl: z.string(),
  }),
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/ingredients', () => {
  it('returns an empty array when no ingredients exist', async () => {
    vi.mocked(prisma.ingredient.findMany).mockResolvedValue([]);

    const response = await GET();

    const body = await assertOkResponse(response, z.array(z.unknown()));
    expect(body).toHaveLength(0);
  });

  it('returns all ingredients with correct shape', async () => {
    vi.mocked(prisma.ingredient.findMany).mockResolvedValue([
      { id: 1, name: 'Cheese', price: 50, imageUrl: 'https://example.com/cheese.png', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Mushrooms', price: 30, imageUrl: 'https://example.com/mushrooms.png', createdAt: new Date(), updatedAt: new Date() },
    ] as any);

    const response = await GET();

    const body = await assertOkResponse(response, ingredientSchema);
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe('Cheese');
    expect(body[1].price).toBe(30);
  });

  it('returns all ingredients — no filtering applied', async () => {
    vi.mocked(prisma.ingredient.findMany).mockResolvedValue([]);

    await GET();

    expect(prisma.ingredient.findMany).toHaveBeenCalledWith();
  });
});
