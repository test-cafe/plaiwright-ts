import { NextRequest } from 'next/server';

// Reads cart token from cookie (web) or X-Cart-Token header (mobile).
export function getCartToken(req: NextRequest): string | undefined {
  return req.cookies.get('cartToken')?.value ?? req.headers.get('x-cart-token') ?? undefined;
}
