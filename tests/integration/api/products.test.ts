// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getById } from '@/app/api/products/[id]/route';
import { GET as search } from '@/app/api/products/search/route';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeCategory, makeProduct, makePizzaItem, makeIngredient } from '../../factories';

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

async function seedProduct(name = 'Margherita') {
  const category = await prisma.category.create({ data: makeCategory({ name: 'Pizzas' }) });
  const product = await prisma.product.create({ data: makeProduct(category.id, { name }) });
  await prisma.productItem.create({ data: makePizzaItem(product.id, { size: 30, pizzaType: 1 }) });
  return product;
}

describe('GET /api/products/[id]', () => {
  it('returns product with items and ingredients', async () => {
    const product = await seedProduct('Margherita');
    const ing = await prisma.ingredient.create({ data: makeIngredient({ name: 'Mozzarella' }) });
    await prisma.product.update({
      where: { id: product.id },
      data: { ingredients: { connect: { id: ing.id } } },
    });

    const req = new NextRequest(`http://localhost/api/products/${product.id}`);
    const res = await getById(req, { params: Promise.resolve({ id: String(product.id) }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('Margherita');
    expect(body.items).toHaveLength(1);
    expect(body.ingredients).toHaveLength(1);
    expect(body.ingredients[0].name).toBe('Mozzarella');
  });

  it('returns null for non-existent product id', async () => {
    const req = new NextRequest('http://localhost/api/products/99999');
    const res = await getById(req, { params: Promise.resolve({ id: '99999' }) });
    const body = await res.json();

    expect(body).toBeNull();
  });
});

describe('GET /api/products/search', () => {
  it('returns products matching query (case-insensitive)', async () => {
    await seedProduct('Margherita');
    await seedProduct('Pepperoni');

    const req = new NextRequest('http://localhost/api/products/search?query=marg');
    const res = await search(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Margherita');
  });

  it('returns up to 5 results', async () => {
    const category = await prisma.category.create({ data: makeCategory() });
    await prisma.product.createMany({
      data: Array.from({ length: 7 }, (_, i) => makeProduct(category.id, { name: `Pizza ${i}` })),
    });

    const req = new NextRequest('http://localhost/api/products/search?query=pizza');
    const res = await search(req);
    const body = await res.json();

    expect(body.length).toBeLessThanOrEqual(5);
  });

  it('returns empty array when no match', async () => {
    await seedProduct('Margherita');

    const req = new NextRequest('http://localhost/api/products/search?query=xyznotfound');
    const res = await search(req);
    const body = await res.json();

    expect(body).toEqual([]);
  });

  it('returns all products when query is empty', async () => {
    await seedProduct('Margherita');
    await seedProduct('Pepperoni');

    const req = new NextRequest('http://localhost/api/products/search?query=');
    const res = await search(req);
    const body = await res.json();

    expect(body.length).toBeGreaterThanOrEqual(2);
  });
});
