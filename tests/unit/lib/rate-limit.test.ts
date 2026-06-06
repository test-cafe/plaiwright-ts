import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

// Each test uses a unique prefix so the module-level store doesn't bleed between tests.
let prefixCounter = 0;
const nextPrefix = () => `test-rl-${prefixCounter++}`;

function makeReq(ip: string): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    headers: new Headers({ 'x-forwarded-for': ip }),
  });
}

describe('rateLimit', () => {
  it('returns null for the first request', () => {
    const result = rateLimit(makeReq('1.1.1.1'), { limit: 5, window: 60, prefix: nextPrefix() });
    expect(result).toBeNull();
  });

  it('returns null when request count exactly equals the limit', () => {
    const prefix = nextPrefix();
    const req = makeReq('2.2.2.2');
    rateLimit(req, { limit: 3, window: 60, prefix }); // count 1
    rateLimit(req, { limit: 3, window: 60, prefix }); // count 2
    const result = rateLimit(req, { limit: 3, window: 60, prefix }); // count 3 (not > 3)
    expect(result).toBeNull();
  });

  it('returns a 429 response when the limit is exceeded', () => {
    const prefix = nextPrefix();
    const req = makeReq('3.3.3.3');
    rateLimit(req, { limit: 2, window: 60, prefix }); // count 1
    rateLimit(req, { limit: 2, window: 60, prefix }); // count 2
    const result = rateLimit(req, { limit: 2, window: 60, prefix }); // count 3 > 2
    expect(result?.status).toBe(429);
  });

  it('429 response body has a human-readable message', async () => {
    const prefix = nextPrefix();
    const req = makeReq('4.4.4.4');
    rateLimit(req, { limit: 1, window: 60, prefix });
    const result = rateLimit(req, { limit: 1, window: 60, prefix });
    const body = await result?.json();
    expect(body?.message).toMatch(/too many requests/i);
  });

  it('429 response includes X-RateLimit-Limit and X-RateLimit-Remaining headers', () => {
    const prefix = nextPrefix();
    const req = makeReq('5.5.5.5');
    rateLimit(req, { limit: 1, window: 30, prefix });
    const result = rateLimit(req, { limit: 1, window: 30, prefix });
    expect(result?.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('429 response includes a Retry-After header', () => {
    const prefix = nextPrefix();
    const req = makeReq('6.6.6.6');
    rateLimit(req, { limit: 1, window: 30, prefix });
    const result = rateLimit(req, { limit: 1, window: 30, prefix });
    const retryAfter = Number(result?.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(30);
  });

  it('different IPs have independent counters', () => {
    const prefix = nextPrefix();
    // IP A exhausts its limit
    rateLimit(makeReq('10.0.0.1'), { limit: 1, window: 60, prefix });
    rateLimit(makeReq('10.0.0.1'), { limit: 1, window: 60, prefix });
    // IP B should still be allowed
    const result = rateLimit(makeReq('10.0.0.2'), { limit: 1, window: 60, prefix });
    expect(result).toBeNull();
  });

  it('resets the counter after the window expires', () => {
    vi.useFakeTimers();
    const prefix = nextPrefix();
    const req = makeReq('7.7.7.7');

    rateLimit(req, { limit: 1, window: 60, prefix }); // count 1
    const blocked = rateLimit(req, { limit: 1, window: 60, prefix }); // count 2 → 429
    expect(blocked?.status).toBe(429);

    vi.advanceTimersByTime(61_000); // advance past the 60 s window

    const result = rateLimit(req, { limit: 1, window: 60, prefix }); // window reset, count 1
    expect(result).toBeNull();

    vi.useRealTimers();
  });

  it('uses x-real-ip as fallback when x-forwarded-for is absent', () => {
    const prefix = nextPrefix();
    const req = new NextRequest('http://localhost/api/test', {
      headers: new Headers({ 'x-real-ip': '8.8.8.8' }),
    });
    const result = rateLimit(req, { limit: 5, window: 60, prefix });
    expect(result).toBeNull();
  });
});
