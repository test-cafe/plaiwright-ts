import { GetSearchParams } from '@/lib/find-pizzas';
import { getSearchParams } from '@/lib/get-search-params';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const params = getSearchParams<GetSearchParams>(req.url);

    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: params.query,
          mode: 'insensitive',
        },
      },
      take: 5,
    });

    return NextResponse.json(products);
  } catch (error) {
    logger.error({ error }, '[API] GET /products/search failed');
    return NextResponse.json([], { status: 500 });
  }
}
