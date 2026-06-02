import { NextRequest, NextResponse } from 'next/server';

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Prune expired entries every 5 minutes to prevent unbounded growth
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  },
  5 * 60 * 1000,
);

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

/**
 * Fixed-window rate limiter.
 * Returns a 429 NextResponse when the limit is exceeded, otherwise null.
 *
 * limit  — max requests per window
 * window — window size in seconds
 * prefix — namespaces keys so different endpoints don't share counters
 */
export function rateLimit(
  req: NextRequest,
  { limit, window: windowSec, prefix }: { limit: number; window: number; prefix: string },
): NextResponse | null {
  const ip = getIp(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
