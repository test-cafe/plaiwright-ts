import { describe, it, expect, vi } from 'vitest';
import {
  findPizzas,
  parseSearchParams,
  sortProductsByPrice,
} from '@/lib/find-pizzas';
import type {
  PaginationMeta,
  PizzaQueryResult,
  PizzaRepository,
} from '@/lib/repositories/pizza-repository';
import type { CategoryProducts } from '@/@types/prisma';
import type { Ingredient, Product, ProductItem } from '@prisma/client';

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 10000;
const DEFAULT_LIMIT = 12;
const DEFAULT_PAGE = 1;

const CUSTOM_MIN_PRICE = 200;
const CUSTOM_MAX_PRICE = 800;
const CUSTOM_MIN_PRICE_CENTS = 20000;
const CUSTOM_MAX_PRICE_CENTS = 80000;
const CUSTOM_LIMIT = 6;
const CUSTOM_PAGE = 3;

const INGREDIENT_IDS = [3, 7, 12];
const PIZZA_SIZES = [20, 30];
const PIZZA_TYPES = [1, 2];

const EMPTY_META: PaginationMeta = {
  totalCount: 0,
  pageCount: 1,
  currentPage: 1,
  isFirstPage: true,
  isLastPage: true,
};

function createMockRepo(result: PizzaQueryResult = [[], EMPTY_META]): PizzaRepository {
  return { findPizzas: vi.fn().mockResolvedValue(result) };
}

function makeProduct(
  id: number,
  name: string,
  prices: number[],
): Product & { items: ProductItem[]; ingredients: Ingredient[] } {
  return {
    id,
    name,
    imageUrl: '',
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [],
    items: prices.map((price, i) => ({
      id: i,
      price,
      size: 30,
      pizzaType: 1,
      productId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
}

function makeCategory(products: ReturnType<typeof makeProduct>[]): CategoryProducts {
  return { id: 1, name: 'Pizza', products };
}

describe('parseSearchParams', () => {
  describe('price range', () => {
    it('uses default min and max when both are absent', () => {
      const filter = parseSearchParams({});

      expect(filter.minPrice).toBe(DEFAULT_MIN_PRICE);
      expect(filter.maxPrice).toBe(DEFAULT_MAX_PRICE);
    });

    it('parses provided priceFrom and priceTo', () => {
      const filter = parseSearchParams({
        priceFrom: String(CUSTOM_MIN_PRICE),
        priceTo: String(CUSTOM_MAX_PRICE),
      });

      expect(filter.minPrice).toBe(CUSTOM_MIN_PRICE_CENTS);
      expect(filter.maxPrice).toBe(CUSTOM_MAX_PRICE_CENTS);
    });
  });

  describe('list params', () => {
    it('parses ingredients into an id array', () => {
      const filter = parseSearchParams({ ingredients: INGREDIENT_IDS.join(',') });

      expect(filter.ingredientIds).toEqual(INGREDIENT_IDS);
    });

    it('parses sizes into a number array', () => {
      const filter = parseSearchParams({ sizes: PIZZA_SIZES.join(',') });

      expect(filter.sizes).toEqual(PIZZA_SIZES);
    });

    it('parses pizzaTypes into a number array', () => {
      const filter = parseSearchParams({ pizzaTypes: PIZZA_TYPES.join(',') });

      expect(filter.pizzaTypes).toEqual(PIZZA_TYPES);
    });

    it('leaves list params undefined when absent', () => {
      const filter = parseSearchParams({});

      expect(filter.ingredientIds).toBeUndefined();
      expect(filter.sizes).toBeUndefined();
      expect(filter.pizzaTypes).toBeUndefined();
    });
  });

  describe('orderBy', () => {
    it('defaults to id-desc when sortBy is unset', () => {
      const filter = parseSearchParams({});

      expect(filter.orderBy).toBe('id-desc');
    });

    it('uses createdAt-asc when sortBy is rating', () => {
      const filter = parseSearchParams({ sortBy: 'rating' });

      expect(filter.orderBy).toBe('createdAt-asc');
    });
  });

  describe('pagination', () => {
    it('uses default limit and page when both are absent', () => {
      const filter = parseSearchParams({});

      expect(filter.limit).toBe(DEFAULT_LIMIT);
      expect(filter.page).toBe(DEFAULT_PAGE);
    });

    it('parses limit and page from strings', () => {
      const filter = parseSearchParams({
        limit: String(CUSTOM_LIMIT),
        page: String(CUSTOM_PAGE),
      });

      expect(filter.limit).toBe(CUSTOM_LIMIT);
      expect(filter.page).toBe(CUSTOM_PAGE);
    });
  });
});

describe('sortProductsByPrice', () => {
  it('sorts products cheap-to-expensive by their lowest item price', () => {
    const category = makeCategory([
      makeProduct(1, 'Expensive', [900, 1100]),
      makeProduct(2, 'Cheap', [300, 500]),
      makeProduct(3, 'Mid', [600, 700]),
    ]);

    sortProductsByPrice([category], 'cheap');

    expect(category.products.map((p) => p.name)).toEqual(['Cheap', 'Mid', 'Expensive']);
  });

  it('sorts products expensive-to-cheap by their lowest item price', () => {
    const category = makeCategory([
      makeProduct(1, 'Cheap', [300, 500]),
      makeProduct(2, 'Expensive', [900, 1100]),
      makeProduct(3, 'Mid', [600, 700]),
    ]);

    sortProductsByPrice([category], 'expensive');

    expect(category.products.map((p) => p.name)).toEqual(['Expensive', 'Mid', 'Cheap']);
  });
});

describe('findPizzas', () => {
  it('forwards the parsed filter to the repository', async () => {
    const repo = createMockRepo();

    await findPizzas(
      {
        priceFrom: String(CUSTOM_MIN_PRICE),
        priceTo: String(CUSTOM_MAX_PRICE),
        ingredients: INGREDIENT_IDS.join(','),
      },
      repo,
    );

    expect(repo.findPizzas).toHaveBeenCalledWith(
      expect.objectContaining({
        minPrice: CUSTOM_MIN_PRICE_CENTS,
        maxPrice: CUSTOM_MAX_PRICE_CENTS,
        ingredientIds: INGREDIENT_IDS,
      }),
    );
  });

  it('returns the repository result unchanged when no post-sort is requested', async () => {
    const meta: PaginationMeta = { ...EMPTY_META, totalCount: 42 };
    const repo = createMockRepo([[], meta]);

    const [categories, returnedMeta] = await findPizzas({}, repo);

    expect(categories).toEqual([]);
    expect(returnedMeta).toEqual(meta);
  });

  it('applies cheap post-sort to the repository result', async () => {
    const category = makeCategory([
      makeProduct(1, 'Expensive', [900]),
      makeProduct(2, 'Cheap', [300]),
    ]);
    const repo = createMockRepo([[category], EMPTY_META]);

    const [categories] = await findPizzas({ sortBy: 'cheap' }, repo);

    expect(categories[0].products.map((p) => p.name)).toEqual(['Cheap', 'Expensive']);
  });

  it('applies expensive post-sort to the repository result', async () => {
    const category = makeCategory([
      makeProduct(1, 'Cheap', [300]),
      makeProduct(2, 'Expensive', [900]),
    ]);
    const repo = createMockRepo([[category], EMPTY_META]);

    const [categories] = await findPizzas({ sortBy: 'expensive' }, repo);

    expect(categories[0].products.map((p) => p.name)).toEqual(['Expensive', 'Cheap']);
  });
});
