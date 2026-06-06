import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { getCartToken } from '@/lib/get-cart-token';

function makeReq(
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
): NextRequest {
  const hdrs = new Headers(headers);
  if (Object.keys(cookies).length > 0) {
    hdrs.set('cookie', Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '));
  }
  return new NextRequest('http://localhost/', { headers: hdrs });
}

describe('getCartToken', () => {
  it('reads token from cartToken cookie', () => {
    const req = makeReq({ cartToken: 'cookie-token' });
    expect(getCartToken(req)).toBe('cookie-token');
  });

  it('falls back to x-cart-token header when no cookie', () => {
    const req = makeReq({}, { 'x-cart-token': 'header-token' });
    expect(getCartToken(req)).toBe('header-token');
  });

  it('prefers cookie over x-cart-token header when both are present', () => {
    const req = makeReq({ cartToken: 'from-cookie' }, { 'x-cart-token': 'from-header' });
    expect(getCartToken(req)).toBe('from-cookie');
  });

  it('returns undefined when neither source is present', () => {
    const req = makeReq();
    expect(getCartToken(req)).toBeUndefined();
  });

  it('ignores unrelated cookies', () => {
    const req = makeReq({ session: 'abc', theme: 'dark' });
    expect(getCartToken(req)).toBeUndefined();
  });
});
