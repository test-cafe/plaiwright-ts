import type { CategoryProducts } from '@/@types/prisma';

export interface PizzaFilter {
  query?: string;
  ingredientIds?: number[];
  sizes?: number[];
  pizzaTypes?: number[];
  minPrice: number;
  maxPrice: number;
  page: number;
  limit: number;
  orderBy: 'id-desc' | 'createdAt-asc';
}

export interface PaginationMeta {
  totalCount: number;
  pageCount: number;
  currentPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export type PizzaQueryResult = [CategoryProducts[], PaginationMeta];

export interface PizzaRepository {
  findPizzas(filter: PizzaFilter): Promise<PizzaQueryResult>;
}
