# Next Pizza

A production-style pizza ordering app built on **Next.js 16 (App Router)**, **TypeScript**, **Prisma / Postgres**, and **Stripe**. Deployed on Vercel with a Neon Postgres backend, tested with Vitest and Playwright.

**Live demo:** <https://next-pizza-pw-ts.vercel.app>

## Demo credentials

| Role  | Email             | Password |
|-------|-------------------|----------|
| User  | `user@test.ru`    | `111111` |
| Admin | `admin@test.ru`   | `111111` — grants access to `/dashboard` |

## Try it out

1. Browse pizzas on the homepage, filter by size / dough / ingredients / price.
2. Click a product to open the intercepted-route modal, customise, add to cart.
3. Check out with the Stripe test card `4242 4242 4242 4242`, any future date, any CVC.
4. Log in as admin to see the CRUD dashboard (products, categories, ingredients, orders, users).

---

## What's interesting in this codebase

- **Intercepted parallel routes** for the product modal — `app/(root)/@modal/(.)product/[id]/page.tsx` renders a Dialog when navigated from a card, while `app/(root)/product/[id]/page.tsx` handles direct URL access.
- **Cart merge on login** — anonymous carts (tracked by `cartToken` cookie) merge into the user's cart on sign-in, with duplicate protection.
- **Money stored as integer cents** — matches Stripe's amount format and eliminates float-precision surprises.
- **Repository pattern** rolled out across Prisma call sites so data access is testable and swappable.
- **Auth** via NextAuth.js with Credentials, Google, and GitHub providers; JWT-backed sessions expose `role` for server-side guards.
- **Server Actions for mutations** from forms, thin API routes for cart CRUD and Stripe webhooks.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind · Radix UI · Prisma · PostgreSQL · NextAuth.js · Stripe · Zustand · React Hook Form · Zod · Resend · Vercel · Neon

## Testing

The test story is the differentiator worth clicking on:

```bash
npm run test              # Vitest — unit + integration
npm run test:unit         # pure logic
npm run test:integration  # real Postgres via Docker (npm run test:db:up first)
npm run test:e2e          # Playwright, all suites
npm run test:e2e:smoke    # @smoke-tagged happy paths
npm run test:e2e:a11y     # @a11y-tagged accessibility checks
```

Structure:

```
tests/
  e2e/           Playwright, tagged @smoke / @regression / @a11y
  integration/   Vitest + real test DB, cleanDb() helper between tests
  unit/          Pure utility tests
  factories/     Faker-based data builders
  helpers/       Shared test utilities
```

For the full test plan and QA onboarding, see [`TEST_PLAN.md`](./TEST_PLAN.md) and [`ONBOARDING_TESTERS.md`](./ONBOARDING_TESTERS.md).

## Architecture

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — high-level system design.
- [`ONBOARDING.md`](./ONBOARDING.md) — engineer onboarding walkthrough.
- [`DOCUMENTATION.md`](./DOCUMENTATION.md) — feature-level documentation.
- [`CLAUDE.md`](./CLAUDE.md) — codebase conventions and non-obvious behavior.

## Running locally

```bash
git clone https://github.com/test-cafe/plaiwright-ts.git
cd plaiwright-ts
npm install
cp .env.example .env.local     # fill in DATABASE_URL, NEXTAUTH_SECRET, Stripe keys, etc.
npm run prisma:migrate         # apply schema
npm run prisma:seed            # seed products, categories, ingredients, test users
npm run dev                    # http://localhost:3000
```

See [`ONBOARDING.md`](./ONBOARDING.md) for a full walkthrough including Neon and Docker test-DB setup.
