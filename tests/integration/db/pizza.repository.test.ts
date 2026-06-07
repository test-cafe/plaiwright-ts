import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createProductFactory } from '@/tests/fixtures/db/products';
import { prismaPizzaRepository } from '@/lib/repositories/prisma-pizza-repository';
import type { PizzaFilter } from '@/lib/repositories/pizza-repository';

const prisma = useTestDb();
const productFactory = createProductFactory(prisma as any);

const HIGH_PRICE_CEILING = 100000;
const SIZE_SMALL = 25;
const SIZE_LARGE = 35;
const PIZZA_TYPE_TRADITIONAL = 1;
const PIZZA_TYPE_SICILIAN = 2;

const baseFilter: PizzaFilter = {
  minPrice: 0,
  maxPrice: HIGH_PRICE_CEILING,
  page: 1,
  limit: 12,
  orderBy: 'id-desc',
};

beforeEach(async () => {
  await cleanDb();
});

describe('PrismaPizzaRepository.findPizzas', () => {
  describe('price filter', () => {
    it('excludes products whose only item is above maxPrice', async () => {
      const category = await productFactory.buildCategory('Pizza');
      const affordable = await productFactory.buildProduct(category.id, { name: 'Affordable' });
      await productFactory.buildProductItem(affordable.id, { price: 500 });
      const pricey = await productFactory.buildProduct(category.id, { name: 'Pricey' });
      await productFactory.buildProductItem(pricey.id, { price: 5000 });

      const [categories] = await prismaPizzaRepository.findPizzas({
        ...baseFilter,
        minPrice: 0,
        maxPrice: 1000,
      });

      const names = categories[0].products.map((p) => p.name);
      expect(names).toContain('Affordable');
      expect(names).not.toContain('Pricey');
    });

    it('excludes products whose items are all below minPrice', async () => {
      const category = await productFactory.buildCategory('Pizza');
      const cheap = await productFactory.buildProduct(category.id, { name: 'Cheap' });
      await productFactory.buildProductItem(cheap.id, { price: 100 });
      const midRange = await productFactory.buildProduct(category.id, { name: 'MidRange' });
      await productFactory.buildProductItem(midRange.id, { price: 700 });

      const [categories] = await prismaPizzaRepository.findPizzas({
        ...baseFilter,
        minPrice: 500,
        maxPrice: HIGH_PRICE_CEILING,
      });

      const names = categories[0].products.map((p) => p.name);
      expect(names).toContain('MidRange');
      expect(names).not.toContain('Cheap');
    });
  });

  describe('ingredient filter', () => {
    it('returns only products that include at least one requested ingredient', async () => {
      const category = await productFactory.buildCategory('Pizza');
      const cheese = await productFactory.buildIngredient({ name: 'Cheese' });
      const onion = await productFactory.buildIngredient({ name: 'Onion' });

      const cheesy = await productFactory.buildProduct(category.id, { name: 'Cheesy' });
      await productFactory.buildProductItem(cheesy.id, { price: 500 });
      await prisma.product.update({
        where: { id: cheesy.id },
        data: { ingredients: { connect: { id: cheese.id } } },
      });

      const oniony = await productFactory.buildProduct(category.id, { name: 'Oniony' });
      await productFactory.buildProductItem(oniony.id, { price: 500 });
      await prisma.product.update({
        where: { id: oniony.id },
        data: { ingredients: { connect: { id: onion.id } } },
      });

      const [categories] = await prismaPizzaRepository.findPizzas({
        ...baseFilter,
        ingredientIds: [cheese.id],
      });

      const names = categories[0].products.map((p) => p.name);
      expect(names).toContain('Cheesy');
      expect(names).not.toContain('Oniony');
    });
  });

  describe('size filter', () => {
    it('returns only products offering at least one requested size', async () => {
      const category = await productFactory.buildCategory('Pizza');
      const smallOnly = await productFactory.buildProduct(category.id, { name: 'SmallOnly' });
      await productFactory.buildProductItem(smallOnly.id, { price: 500, size: SIZE_SMALL });
      const largeOnly = await productFactory.buildProduct(category.id, { name: 'LargeOnly' });
      await productFactory.buildProductItem(largeOnly.id, { price: 500, size: SIZE_LARGE });

      const [categories] = await prismaPizzaRepository.findPizzas({
        ...baseFilter,
        sizes: [SIZE_SMALL],
      });

      const names = categories[0].products.map((p) => p.name);
      expect(names).toContain('SmallOnly');
      expect(names).not.toContain('LargeOnly');
    });
  });

  describe('pizzaType filter', () => {
    it('returns only products offering at least one requested pizzaType', async () => {
      const category = await productFactory.buildCategory('Pizza');
      const traditional = await productFactory.buildProduct(category.id, { name: 'Traditional' });
      await productFactory.buildProductItem(traditional.id, {
        price: 500,
        pizzaType: PIZZA_TYPE_TRADITIONAL,
      });
      const sicilian = await productFactory.buildProduct(category.id, { name: 'Sicilian' });
      await productFactory.buildProductItem(sicilian.id, {
        price: 500,
        pizzaType: PIZZA_TYPE_SICILIAN,
      });

      const [categories] = await prismaPizzaRepository.findPizzas({
        ...baseFilter,
        pizzaTypes: [PIZZA_TYPE_TRADITIONAL],
      });

      const names = categories[0].products.map((p) => p.name);
      expect(names).toContain('Traditional');
      expect(names).not.toContain('Sicilian');
    });
  });

  describe('item ordering', () => {
    it('returns each product\'s items sorted by price ascending', async () => {
      const category = await productFactory.buildCategory('Pizza');
      const product = await productFactory.buildProduct(category.id, { name: 'Pepperoni' });
      await productFactory.buildProductItem(product.id, { price: 999 });
      await productFactory.buildProductItem(product.id, { price: 499 });
      await productFactory.buildProductItem(product.id, { price: 799 });

      const [categories] = await prismaPizzaRepository.findPizzas(baseFilter);

      const prices = categories[0].products[0].items.map((i) => i.price);
      expect(prices).toEqual([499, 799, 999]);
    });
  });

  describe('pagination', () => {
    it('returns pageCount and totalCount based on the category count', async () => {
      await productFactory.buildCategory('Pizza');
      await productFactory.buildCategory('Drinks');
      await productFactory.buildCategory('Desserts');

      const [, meta] = await prismaPizzaRepository.findPizzas({
        ...baseFilter,
        limit: 2,
        page: 1,
      });

      expect(meta.totalCount).toBe(3);
      expect(meta.pageCount).toBe(2);
      expect(meta.currentPage).toBe(1);
      expect(meta.isFirstPage).toBe(true);
      expect(meta.isLastPage).toBe(false);
    });
  });
});
