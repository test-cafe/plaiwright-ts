import { prisma } from '@/lib/prisma';

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
const DEFAULT_MAX_PRICE = 100;

const DEFAULT_LIMIT = 12;
const DEFAULT_PAGE = 1;

export const findPizzas = async (params: GetSearchParams) => {
  const ingredientsIdArr = params.ingredients?.split(',').map(Number);
  const pizzaTypes = params.pizzaTypes?.split(',').map(Number);
  const sizes = params.sizes?.split(',').map(Number);

  const minPrice = Number(params.priceFrom) || DEFAULT_MIN_PRICE;
  const maxPrice = Number(params.priceTo) || DEFAULT_MAX_PRICE;

  const limit = Number(params.limit || DEFAULT_LIMIT);
  const page = Number(params.page || DEFAULT_PAGE);

  const sortBy = params.sortBy;
  const productsOrderBy =
    sortBy === 'rating' ? { createdAt: 'asc' as const } : { id: 'desc' as const };

  const result = await prisma.category
    .paginate({
      include: {
        products: {
          orderBy: productsOrderBy,
          where: {
            name: params.query ? { contains: params.query, mode: 'insensitive' } : undefined,
            ingredients: ingredientsIdArr
              ? {
                  some: {
                    id: {
                      in: ingredientsIdArr,
                    },
                  },
                }
              : undefined,
            items: {
              some: {
                size: sizes ? { in: sizes } : undefined,
                pizzaType: pizzaTypes ? { in: pizzaTypes } : undefined,
                price: { lte: maxPrice },
              },
              every: {
                price: { gte: minPrice },
              },
            },
          },
          include: {
            ingredients: true,
            items: {
              orderBy: {
                price: 'asc',
              },
            },
          },
        },
      },
    })
    .withPages({
      page,
      limit,
      includePageCount: true,
    });

  const [categories, meta] = result;

  if (sortBy === 'cheap' || sortBy === 'expensive') {
    categories.forEach((category) => {
      category.products.sort((a, b) => {
        const minA = Math.min(...a.items.map((i) => i.price));
        const minB = Math.min(...b.items.map((i) => i.price));
        return sortBy === 'cheap' ? minA - minB : minB - minA;
      });
    });
  }

  return [categories, meta] as typeof result;
};
