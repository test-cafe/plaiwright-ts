import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

let prefixCounter = 0;
const nextPrefix = () => `test-rl-${prefixCounter++}`;

function makeReq(ip: string): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    headers: new Headers({ 'x-forwarded-for': ip }),
  });
}

const PERMISSIVE_LIMIT = 5;
const SMALL_LIMIT = 1;
const AT_BOUNDARY_LIMIT = 3;
const EXCEEDED_LIMIT = 2;
const STANDARD_WINDOW = 60;
const SHORT_WINDOW = 30;
const PAST_WINDOW_MS = 61_000;

describe('rateLimit', () => {
  describe('when under the limit', () => {
    it('allows the first request', () => {
      const result = rateLimit(makeReq('1.1.1.1'), { limit: PERMISSIVE_LIMIT, window: STANDARD_WINDOW, prefix: nextPrefix() });

      expect(result).toBeNull();
    });

    it('allows a request that is exactly at the limit', () => {
      const prefix = nextPrefix();
      const req = makeReq('2.2.2.2');

      rateLimit(req, { limit: AT_BOUNDARY_LIMIT, window: STANDARD_WINDOW, prefix }); // count 1
      rateLimit(req, { limit: AT_BOUNDARY_LIMIT, window: STANDARD_WINDOW, prefix }); // count 2
      const result = rateLimit(req, { limit: AT_BOUNDARY_LIMIT, window: STANDARD_WINDOW, prefix }); // count 3 (not > 3)

      expect(result).toBeNull();
    });
  });

  describe('when the limit is exceeded', () => {
    it('returns a 429 response', () => {
      const prefix = nextPrefix();
      const req = makeReq('3.3.3.3');

      rateLimit(req, { limit: EXCEEDED_LIMIT, window: STANDARD_WINDOW, prefix }); // count 1
      rateLimit(req, { limit: EXCEEDED_LIMIT, window: STANDARD_WINDOW, prefix }); // count 2
      const result = rateLimit(req, { limit: EXCEEDED_LIMIT, window: STANDARD_WINDOW, prefix }); // count 3 > 2

      expect(result?.status).toBe(429);
    });

    it('includes a human-readable error message', async () => {
      const prefix = nextPrefix();
      const req = makeReq('4.4.4.4');

      rateLimit(req, { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix });
      const result = rateLimit(req, { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix });

      const body = await result?.json();
      expect(body?.message).toMatch(/too many requests/i);
    });

    it('includes an X-RateLimit-Limit header', () => {
      const prefix = nextPrefix();
      const req = makeReq('5.5.5.5');

      rateLimit(req, { limit: SMALL_LIMIT, window: SHORT_WINDOW, prefix });
      const result = rateLimit(req, { limit: SMALL_LIMIT, window: SHORT_WINDOW, prefix });

      expect(result?.headers.get('X-RateLimit-Limit')).toBe(String(SMALL_LIMIT));
    });

    it('includes an X-RateLimit-Remaining header', () => {
      const prefix = nextPrefix();
      const req = makeReq('5.5.5.6');

      rateLimit(req, { limit: SMALL_LIMIT, window: SHORT_WINDOW, prefix });
      const result = rateLimit(req, { limit: SMALL_LIMIT, window: SHORT_WINDOW, prefix });

      expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('includes a Retry-After header within the window duration', () => {
      const prefix = nextPrefix();
      const req = makeReq('6.6.6.6');

      rateLimit(req, { limit: SMALL_LIMIT, window: SHORT_WINDOW, prefix });
      const result = rateLimit(req, { limit: SMALL_LIMIT, window: SHORT_WINDOW, prefix });

      const retryAfter = Number(result?.headers.get('Retry-After'));
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(SHORT_WINDOW);
    });
  });

  describe('per-IP isolation', () => {
    it('counts each IP independently', () => {
      const prefix = nextPrefix();

      rateLimit(makeReq('10.0.0.1'), { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix });
      rateLimit(makeReq('10.0.0.1'), { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix });
      const result = rateLimit(makeReq('10.0.0.2'), { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix });

      expect(result).toBeNull();
    });
  });

  describe('window expiration', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('resets the counter when the window expires', () => {
      const prefix = nextPrefix();
      const req = makeReq('7.7.7.7');

      rateLimit(req, { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix }); // count 1
      const blocked = rateLimit(req, { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix }); // count 2 → 429
      expect(blocked?.status).toBe(429);

      vi.advanceTimersByTime(PAST_WINDOW_MS);

      const result = rateLimit(req, { limit: SMALL_LIMIT, window: STANDARD_WINDOW, prefix }); // window reset, count 1
      expect(result).toBeNull();
    });
  });

  describe('IP resolution', () => {
    it('falls back to x-real-ip when x-forwarded-for is absent', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: new Headers({ 'x-real-ip': '8.8.8.8' }),
      });

      const result = rateLimit(req, { limit: PERMISSIVE_LIMIT, window: STANDARD_WINDOW, prefix: nextPrefix() });

      expect(result).toBeNull();
    });
  });
});
