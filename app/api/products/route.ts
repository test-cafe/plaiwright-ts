import { findPizzas, GetSearchParams } from '@/lib/find-pizzas';
import { getSearchParams } from '@/lib/get-search-params';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const params = getSearchParams<GetSearchParams>(req.url);
  const [categories, meta] = await findPizzas(params);

  return NextResponse.json({ categories, meta });
}
