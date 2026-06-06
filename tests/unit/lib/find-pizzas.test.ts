import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findPizzas } from '@/lib/find-pizzas';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      paginate: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const emptyMeta = {
  totalCount: 0,
  pageCount: 1,
  currentPage: 1,
  isFirstPage: true,
  isLastPage: true,
};

function makeProduct(id: number, name: string, prices: number[]) {
  return {
    id,
    name,
    imageUrl: '',
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [],
    items: prices.map((price, i) => ({ id: i, price, size: 30, pizzaType: 1 })),
  };
}

const mockWithPages = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.category.paginate).mockReturnValue({ withPages: mockWithPages } as any);
  mockWithPages.mockResolvedValue([[], emptyMeta]);
});

describe('findPizzas', () => {
  it('uses default price range when priceFrom and priceTo are absent', async () => {
    await findPizzas({});

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    const itemsFilter = call.include.products.where.items;
    expect(itemsFilter.some.price).toEqual({ lte: 100 });
    expect(itemsFilter.every.price).toEqual({ gte: 0 });
  });

  it('passes priceFrom and priceTo to the items price filter', async () => {
    await findPizzas({ priceFrom: '200', priceTo: '800' });

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    const itemsFilter = call.include.products.where.items;
    expect(itemsFilter.some.price).toEqual({ lte: 800 });
    expect(itemsFilter.every.price).toEqual({ gte: 200 });
  });

  it('passes parsed ingredient ids to the where clause', async () => {
    await findPizzas({ ingredients: '3,7,12' });

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    expect(call.include.products.where.ingredients).toEqual({
      some: { id: { in: [3, 7, 12] } },
    });
  });

  it('omits the ingredients filter when the param is absent', async () => {
    await findPizzas({});

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    expect(call.include.products.where.ingredients).toBeUndefined();
  });

  it('passes parsed sizes to the items where clause', async () => {
    await findPizzas({ sizes: '20,30' });

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    expect(call.include.products.where.items.some.size).toEqual({ in: [20, 30] });
  });

  it('passes parsed pizzaTypes to the items where clause', async () => {
    await findPizzas({ pizzaTypes: '1,2' });

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    expect(call.include.products.where.items.some.pizzaType).toEqual({ in: [1, 2] });
  });

  it('uses id desc order when sortBy is not set', async () => {
    await findPizzas({});

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    expect(call.include.products.orderBy).toEqual({ id: 'desc' });
  });

  it('uses createdAt asc order when sortBy is rating', async () => {
    await findPizzas({ sortBy: 'rating' });

    const call = vi.mocked(prisma.category.paginate).mock.calls[0][0] as any;
    expect(call.include.products.orderBy).toEqual({ createdAt: 'asc' });
  });

  it('sorts products cheap-to-expensive when sortBy is cheap', async () => {
    const category = {
      id: 1,
      name: 'Pizza',
      createdAt: new Date(),
      products: [
        makeProduct(1, 'Expensive', [900, 1100]),
        makeProduct(2, 'Cheap', [300, 500]),
        makeProduct(3, 'Mid', [600, 700]),
      ],
    };
    mockWithPages.mockResolvedValue([[category], emptyMeta]);

    const [categories] = await findPizzas({ sortBy: 'cheap' });

    const names = (categories[0] as typeof category).products.map((p) => p.name);
    expect(names).toEqual(['Cheap', 'Mid', 'Expensive']);
  });

  it('sorts products expensive-to-cheap when sortBy is expensive', async () => {
    const category = {
      id: 1,
      name: 'Pizza',
      createdAt: new Date(),
      products: [
        makeProduct(1, 'Cheap', [300, 500]),
        makeProduct(2, 'Expensive', [900, 1100]),
        makeProduct(3, 'Mid', [600, 700]),
      ],
    };
    mockWithPages.mockResolvedValue([[category], emptyMeta]);

    const [categories] = await findPizzas({ sortBy: 'expensive' });

    const names = (categories[0] as typeof category).products.map((p) => p.name);
    expect(names).toEqual(['Expensive', 'Mid', 'Cheap']);
  });

  it('forwards pagination params to withPages', async () => {
    await findPizzas({ limit: '6', page: '3' });

    expect(mockWithPages).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 6, page: 3 }),
    );
  });

  it('uses default pagination when limit and page are absent', async () => {
    await findPizzas({});

    expect(mockWithPages).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 12, page: 1 }),
    );
  });

  it('returns the meta from paginate', async () => {
    const meta = { ...emptyMeta, totalCount: 42, pageCount: 4 };
    mockWithPages.mockResolvedValue([[], meta]);

    const [, returnedMeta] = await findPizzas({});

    expect(returnedMeta).toEqual(meta);
  });
});
