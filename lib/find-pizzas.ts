import type { CategoryProducts } from '@/@types/prisma';
import type {
  PizzaFilter,
  PizzaQueryResult,
  PizzaRepository,
} from '@/lib/repositories/pizza-repository';

export interface GetSearchParams {
  query?: string;
  sortBy?: string;
  sizes?: string;
  pizzaTypes?: string;
  ingredients?: string;
  priceFrom?: string;
  priceTo?: string;
  limit?: string;
  page?: string;
}

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 10000;
const DEFAULT_LIMIT = 12;
const DEFAULT_PAGE = 1;

function parseIdList(raw: string | undefined): number[] | undefined {
  return raw?.split(',').map(Number);
}

function parseDollarParamAsCents(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  return Math.round(Number(raw) * 100) || fallback;
}

export function parseSearchParams(params: GetSearchParams): PizzaFilter {
  return {
    query: params.query,
    ingredientIds: parseIdList(params.ingredients),
    sizes: parseIdList(params.sizes),
    pizzaTypes: parseIdList(params.pizzaTypes),
    minPrice: parseDollarParamAsCents(params.priceFrom, DEFAULT_MIN_PRICE),
    maxPrice: parseDollarParamAsCents(params.priceTo, DEFAULT_MAX_PRICE),
    page: Number(params.page || DEFAULT_PAGE),
    limit: Number(params.limit || DEFAULT_LIMIT),
    orderBy: params.sortBy === 'rating' ? 'createdAt-asc' : 'id-desc',
  };
}

export function sortProductsByPrice(
  categories: CategoryProducts[],
  direction: 'cheap' | 'expensive',
): void {
  categories.forEach((category) => {
    category.products.sort((a, b) => {
      const minA = Math.min(...a.items.map((i) => i.price));
      const minB = Math.min(...b.items.map((i) => i.price));
      return direction === 'cheap' ? minA - minB : minB - minA;
    });
  });
}

export async function findPizzas(
  params: GetSearchParams,
  repo: PizzaRepository,
): Promise<PizzaQueryResult> {
  const filter = parseSearchParams(params);
  const [categories, meta] = await repo.findPizzas(filter);

  if (params.sortBy === 'cheap' || params.sortBy === 'expensive') {
    sortProductsByPrice(categories, params.sortBy);
  }

  return [categories, meta];
}
