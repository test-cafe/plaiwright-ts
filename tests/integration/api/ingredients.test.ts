// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/ingredients/route';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeIngredient } from '../../factories';

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('GET /api/ingredients', () => {
  it('returns empty array when no ingredients exist', async () => {
    const req = new NextRequest('http://localhost/api/ingredients');

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('returns all ingredients', async () => {
    await prisma.ingredient.createMany({
      data: [
        makeIngredient({ name: 'Mozzarella' }),
        makeIngredient({ name: 'Pepperoni' }),
        makeIngredient({ name: 'Basil' }),
      ],
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(3);
    expect(body.map((i: { name: string }) => i.name)).toEqual(
      expect.arrayContaining(['Mozzarella', 'Pepperoni', 'Basil']),
    );
  });

  it('returns ingredients with correct fields', async () => {
    await prisma.ingredient.create({ data: makeIngredient({ name: 'Cheese', price: 99 }) });

    const res = await GET();
    const body = await res.json();

    expect(body[0]).toMatchObject({ name: 'Cheese', price: 99, imageUrl: expect.any(String) });
  });
});
