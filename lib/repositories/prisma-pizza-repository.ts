import { prisma } from '@/lib/prisma';
import type {
  PizzaFilter,
  PizzaQueryResult,
  PizzaRepository,
} from './pizza-repository';

export class PrismaPizzaRepository implements PizzaRepository {
  async findPizzas(filter: PizzaFilter): Promise<PizzaQueryResult> {
    const productsOrderBy =
      filter.orderBy === 'createdAt-asc'
        ? { createdAt: 'asc' as const }
        : { id: 'desc' as const };

    const result = await prisma.category
      .paginate({
        include: {
          products: {
            orderBy: productsOrderBy,
            where: {
              name: filter.query
                ? { contains: filter.query, mode: 'insensitive' as const }
                : undefined,
              ingredients: filter.ingredientIds
                ? { some: { id: { in: filter.ingredientIds } } }
                : undefined,
              items: {
                some: {
                  size: filter.sizes ? { in: filter.sizes } : undefined,
                  pizzaType: filter.pizzaTypes ? { in: filter.pizzaTypes } : undefined,
                  price: { lte: filter.maxPrice },
                },
                every: {
                  price: { gte: filter.minPrice },
                },
              },
            },
            include: {
              ingredients: true,
              items: { orderBy: { price: 'asc' } },
            },
          },
        },
      })
      .withPages({
        page: filter.page,
        limit: filter.limit,
        includePageCount: true,
      });

    return result;
  }
}

export const prismaPizzaRepository = new PrismaPizzaRepository();
