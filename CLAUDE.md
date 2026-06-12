# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev               # Start dev server (webpack)
npm run build             # prisma generate + next build
npm run lint              # ESLint

# Database
npm run prisma:migrate    # Run migrations (dev)
npm run prisma:seed       # Seed test data
npm run prisma:studio     # Open Prisma Studio GUI
npm run prisma:reset      # Reset + re-seed
npm run prisma:push       # Push schema without migration

# Testing
npm run test              # All unit/integration tests (vitest)
npm run test:watch        # Watch mode
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only (requires test DB)
npm run test:coverage     # Coverage report
npm run test:e2e          # All Playwright E2E tests
npm run test:e2e:smoke    # @smoke tagged tests only
npm run test:db:up        # Start Docker test DB
npm run test:db:down      # Stop Docker test DB
```

Integration tests need a separate test DB (`pizza_test`). Start it with `test:db:up` before running `test:integration`. E2E tests use `@smoke`, `@regression`, and `@a11y` tags.

## Architecture

Full-stack pizza ordering app built on **Next.js 16 App Router** with TypeScript. The repo is a monolith — no separate backend service.

### Request flow

**Page load (server):** `app/**/page.tsx` (Server Component) → Prisma directly → renders HTML

**Mutations:** Two patterns depending on context:
- **Server Actions** (`app/actions.ts`) — used from forms and client components; call Prisma directly, call Stripe/Resend, call `revalidatePath()`
- **API Routes** (`app/api/`) — used by Zustand stores via Axios (`services/`); handle cart CRUD, auth, file uploads, Stripe webhooks

**Client state:** Zustand stores (`store/`) are the only global client state. `useCartStore` syncs with `/api/cart`; `useCategoryStore` tracks the active nav category. The `services/` folder is the typed Axios wrapper that stores call.

### Key data model concepts

- **ProductItem** — a pizza variant (size × crust type combination). `Product` has many `ProductItem`s, each with its own price.
- **Cart** — identified by either `userId` (logged-in) or `tokenId` (anonymous cookie `cartToken`). On login, the anonymous cart merges into the user cart.
- **Order.items** — stored as a JSON snapshot of the cart at purchase time (immutable history).

### Auth

NextAuth.js with JWT strategy. Three providers: Credentials, Google, GitHub. The `jwt` callback enriches the token with `id` and `role`; the `session` callback exposes these to the client. Config is in `lib/auth-options.ts`. Server-side session: `getServerSession(authOptions)` or the `lib/get-user-session.ts` helper.

### Product modal (intercepted route pattern)

Clicking a product card navigates to `/product/[id]`. The parallel route `app/(root)/@modal/(.)product/[id]/page.tsx` intercepts this and renders a Dialog modal instead of a full page. The full-page version at `app/(root)/product/[id]/page.tsx` is used for direct URL access.

### Cart price display rule

`find-pizzas.ts` returns `items` ordered by `price asc` with no price filter on the include — `items[0].price` is always the product's true minimum price shown on the card. The product filter uses `items.every { price: { gte: minPrice } }` (only show products whose cheapest option meets the floor) and `items.some { price: { lte: maxPrice } }`.

### Category nav active state

`ProductsGroupList` uses an `IntersectionObserver` with `rootMargin: '-45% 0px -45% 0px'` (a thin band across the viewport's vertical middle) so only one section is ever intersecting at a time. It calls `useCategoryStore.setActiveId()` as sections cross that band. Clicking a nav link immediately sets `activeId` and locks the store for 1 s (via `locked` flag) to prevent the observer from overriding it. `Categories` component resets to the first category when `window.scrollY < 100`.

### Prisma quirk

Raw SQL (`prisma.$queryRaw` / `prisma.$executeRaw`) is used for some Cart operations due to a Prisma 5.x Float encoding bug with PostgreSQL. Uses explicit `::float8` cast in UPDATEs.

### Dashboard

`app/dashboard/` contains admin CRUD pages for categories, products, ingredients, product items, users, and orders. All protected by role check. Forms use React Hook Form + Zod. Mutations go through Server Actions in `app/actions.ts`.

### Testing layout

```
tests/
  e2e/           # Playwright — tag with @smoke / @regression / @a11y
  integration/   # Vitest + real test DB; use cleanDb() helper between tests
  unit/          # Pure utility tests
  factories/     # Faker-based test data builders
  helpers/       # Shared test utilities
```
