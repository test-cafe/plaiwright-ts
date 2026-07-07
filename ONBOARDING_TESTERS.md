# Onboarding Guide — Junior Testers

A step-by-step walkthrough of the test suite: what exists, how it's structured, what to run, and how to write new tests.

---

## 1. Test Types at a Glance

The project has three layers of tests. Each serves a different purpose and runs differently.

| Layer | Framework | What it tests | Needs DB? |
|---|---|---|---|
| **Unit** | Vitest | Pure functions and hooks in isolation | No |
| **Integration** | Vitest | API routes and server actions against a real DB | Yes (Docker) |
| **E2E** | Playwright | Full user journeys in a real browser | Yes (Docker) |

---

## 2. Project Structure

```
tests/
├── config/
│   ├── setup.ts          # Loads custom matchers and jest-dom before tests
│   └── .env.test         # Environment variables used by all tests
├── unit/                 # Pure function and hook tests
├── integration/          # API route and server action tests
├── e2e/                  # Browser-based user journey tests
│   ├── global-setup.ts   # Runs once before all E2E tests (creates auth sessions)
│   ├── driver-factory.ts # Creates page-object instances for different user roles
│   ├── pages/            # Page Object Model classes (one per page)
│   └── journeys/         # Actual test specs
├── fixtures/
│   ├── api/              # Static JSON payloads (mock API request bodies)
│   ├── db/               # Faker-based factory functions to create real DB records
│   ├── email/            # Email body fixtures
│   └── mock-prisma-records.ts  # Typed Prisma-shape factories (Prisma.XxxGetPayload) used by unit/integration mocks — replaces `as any` casts
├── helpers/              # Shared utilities used across test types
└── mocks/                # External service mocks (Stripe, Resend, UploadThing)
```

---

## 3. Quick Start: Running Tests

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Start the test database (integration & E2E only)

```bash
npm run test:db:up
```

This starts a PostgreSQL 16 container on port **5433** (isolated from the dev DB on 5432). The credentials and connection string are already in `tests/config/.env.test`.

### Step 3 — Run tests

```bash
# All unit + integration tests
npm run test

# Unit tests only (no DB needed)
npm run test:unit

# Integration tests only (needs DB running)
npm run test:integration

# Coverage report
npm run test:coverage

# E2E — quick smoke tests only
npm run test:e2e:smoke

# E2E — all tests
npm run test:e2e

# E2E — interactive UI mode (great for debugging)
npm run test:e2e:ui
```

### Step 4 — Stop the test DB when done

```bash
npm run test:db:down
```

---

## 4. Unit Tests

**Location:** `tests/unit/`

**What they test:** Single functions or React hooks in isolation. No network calls, no database, no browser.

**Example — price utility** (`tests/unit/lib/calc-cart-item-total-amount.test.ts`):
```
calc-cart-item-total-amount
  ✓ returns base price when no ingredients selected
  ✓ adds ingredient prices to base price
  ✓ handles empty ingredient list
```

**How to write a unit test:**

```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from '@/lib/my-utility';

describe('myUtility', () => {
  it('returns expected output for normal input', () => {
    const result = myUtility('input');
    expect(result).toBe('expected output');
  });
});
```

- No `beforeEach` or database setup needed
- `globals: true` is set in `vitest.config.ts` — you don't need to import `describe`, `it`, or `expect`
- Use `@/` to import from the project root (e.g., `@/lib/...`, `@/store/...`)

**Custom matchers** available via `tests/helpers/custom-matchers.ts`:
- `.toBeWithinRange(floor, ceiling)` — useful for timestamps and IDs
- `.toMatchPrice(expected, tolerance?)` — floating-point price equality (avoids 0.1 + 0.2 = 0.30000000004 failures)

---

## 5. Integration Tests

**Location:** `tests/integration/`

**What they test:** API route handlers and server actions against a real PostgreSQL database. Tests the full server-side logic without a browser.

**Subdirectories:**

| Folder | What's inside |
|---|---|
| `api/auth/` | Sign-in, register, verify email, current user |
| `api/cart/` | Add item, update quantity, remove item, merge guest cart |
| `api/checkout/` | Stripe webhook handler, payment cancellation |
| `api/products/` | List, single item, search |
| `api/ingredients/` | List ingredients |
| `api/stories/` | Stories data |
| `actions/` | Server actions: user update, catalog, password reset, order delete |
| `db/` | Repository / SQL contract tests against the real test DB: `pizza.repository.test.ts` (the filter/sort contract that backs `findPizzas`), `cart.repository.test.ts`, `order.repository.test.ts`, `cart-concurrent.test.ts` (race conditions), `auth-tokens.test.ts` |

### The database isolation pattern

Every integration test file follows this pattern:

```typescript
import { beforeEach, afterAll } from 'vitest';
import { cleanDb, useTestDb } from '@/tests/helpers/db-setup';

const prisma = useTestDb();

beforeEach(async () => {
  await cleanDb(); // wipes all tables in FK-safe order before each test
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

`cleanDb()` deletes rows in dependency order (children before parents) so foreign key constraints don't block the truncation. Always call it in `beforeEach` — never rely on previous test state.

### Building test requests

Use the `request` builder from `tests/helpers/api-builder.ts` to construct `NextRequest` objects:

```typescript
import { request } from '@/tests/helpers/api-builder';

// GET with query params
const req = request.get('/api/products').build();

// POST with JSON body
const req = request.post('/api/cart').json({ productItemId: 1 }).build();

// Authenticated request (adds session cookie)
const req = request.get('/api/cart').authToken(userId).build();

// Anonymous cart request (adds cartToken cookie)
const req = request.post('/api/cart').cartToken('my-token').json({ ... }).build();
```

### Asserting responses

Use `tests/helpers/response-validator.ts`:

```typescript
import { assertOkResponse, assertErrorResponse } from '@/tests/helpers/response-validator';

// Assert 200 + validate response shape
await assertOkResponse(response, schemas.cart);

// Assert error status
await assertErrorResponse(response, 401, 'Unauthorized');
```

### Seeding data for a test

Use factories from `tests/fixtures/db/` to create DB records:

```typescript
import { createProductFactory } from '@/tests/fixtures/db/products';
import { createCartFactory } from '@/tests/fixtures/db/cart';

const productFactory = createProductFactory(prisma);
const cartFactory = createCartFactory(prisma);

// Create a full pizza with two sizes and two ingredients
const { product, items, ingredients } = await productFactory.buildFullPizza();

// Create an anonymous cart with one item
const cart = await cartFactory.buildAnonymous();
await cartFactory.buildWithItem(cart.id, items[0].id);
```

**Never hardcode IDs** in tests — always create fresh records with factories and use their returned IDs.

### Test conventions (enforced repo-wide)

The whole suite was tightened in a file-by-file audit (commits `fda6754` → `47495ec`). Match these patterns in new tests — PR review will push back if you don't:

- **Named constants over magic values.** No bare `5`, `200`, `'admin@test.com'` inside assertions — pull them to `const TAKE_LIMIT = 5` at the top of the file.
- **AAA spacing.** A blank line between Arrange / Act / Assert. The shape should be readable at a glance.
- **Behavior-focused test names.** `'returns 401 when session cookie is missing'`, not `'test auth'`. Nest `describe` blocks by condition (`describe('when the cart is empty', …)`).
- **`beforeEach` only for shared setup.** Don't dump per-test arrangement into `beforeEach` — it hides what each test actually depends on.
- **Zero `as any`.** If a Prisma shape is awkward, fix it at the source (narrow with `Pick<>`) or use a typed factory from `tests/fixtures/mock-prisma-records.ts`. The `tests/tsconfig.json` `include` covers NextAuth module augmentation, so session typing works without casts.
- **Don't test the mock — test the route.** Example: `'does not expose password'` should assert `findUnique` was called with `select: { password: false }`, not inspect a mock-shaped response (which would tautologically match the fixture).

### Mocking external services

External services are mocked at the module level. Mocks live in `tests/mocks/`:
- `stripe.mock.ts` — stubs `createPaymentSession()`, `constructEvent()`
- `resend.mock.ts` — stubs `sendEmail()`
- `uploadthing.mock.ts` — stubs file upload

Import them at the top of test files where those services would be called:

```typescript
import { mockStripe } from '@/tests/mocks/stripe.mock';

mockStripe.createPaymentSession.mockResolvedValue({ url: 'https://stripe.com/pay/...' });
```

---

## 6. E2E Tests

**Location:** `tests/e2e/`

**What they test:** Real user journeys in a Chromium browser against a running Next.js app. Playwright controls the browser, fills forms, clicks buttons, and asserts what the user actually sees.

### Tags

Every E2E test is tagged so you can run a subset:

| Tag | Purpose | When to run |
|---|---|---|
| `@smoke` | Basic sanity checks — does the app start and key flows work? | Every PR |
| `@regression` | Deeper functional flows — filters, auth, admin access | Regular CI / before releases |
| `@a11y` | Accessibility (WCAG 2A/2AA via AxeCore) + keyboard navigation | Before releases |

Tag a test by including the tag in the test title:

```typescript
test('@smoke guest can add pizza to cart', async ({ page }) => { ... });
test('@regression price range filter updates URL params', async ({ page }) => { ... });
test('@a11y home page passes WCAG2AA', async ({ page }) => { ... });
```

### Page Object Model

Instead of calling `page.click()` and `page.fill()` directly in tests, the project uses **Page Object classes** in `tests/e2e/pages/`. Each class wraps the interactions for one page.

```
pages/
├── AuthPage.ts       — login, register, OAuth buttons
├── CartPage.ts       — cart drawer, quantity controls, item list
├── CheckoutPage.ts   — the /cart form steps, submit
├── DashboardPage.ts  — admin CRUD tables
└── ProductPage.ts    — size/crust selectors, ingredient checkboxes, add-to-cart
```

Use the **driver factory** to get a bundled `Driver` (all page objects + `page`, `context`, `dispose`) for a specific user role:

```typescript
import { test } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

test('@regression admin can delete an order', async ({ browser }) => {
  const driver = await DriverFactory.asAdmin(browser);

  await driver.dashboard.gotoOrders();
  await driver.dashboard.deleteEntity(orderId);
  await driver.dashboard.assertEntityRemoved(orderId);

  await driver.dispose();
});
```

Available factories: `asGuest`, `asUser`, `asAdmin`, `asMobile` (iPhone 14 viewport + optional `x-cart-token` header), `asMobileUser` (mobile + persisted user session).

`asUser` / `asAdmin` load stored auth state from `tests/e2e/.auth/` (created by `global-setup.ts` once before the suite runs). You don't need to manually log in inside each test. Always call `driver.dispose()` at the end to close the context cleanly.

### How global-setup works

Before any E2E test runs, `global-setup.ts` launches a browser, navigates to the app, logs in with `TEST_USER_EMAIL` / `TEST_ADMIN_EMAIL` from `.env.test`, and saves the session cookies to `tests/e2e/.auth/user.json` and `tests/e2e/.auth/admin.json`. Each test that needs an authenticated session loads that saved state instead of logging in from scratch.

### Writing a new E2E test

```typescript
import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

test.describe('@regression product filters', () => {
  test('size filter updates URL', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.getByLabel('30 cm').check();

    await expect(driver.page).toHaveURL(/sizes=30/);

    await driver.dispose();
  });
});
```

If the dashboard table you're testing extends past the default 1280px viewport (e.g. the orders table has 8 columns), set a wider viewport on the `describe`:

```typescript
test.describe('@regression Admin order management', () => {
  test.use({ viewport: { width: 1600, height: 900 } });
  // ...
});
```

**Tips:**
- Always prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors — they're more resilient and also test accessibility. Use `[data-testid="…"]` only when no semantic locator is available (and add the testid to the component rather than coupling to a class name).
- Use `await expect(locator).toBeVisible()` rather than `page.waitForTimeout()` — Playwright auto-retries assertions.
- If you need to test loading states, use `page.waitForResponse()` to intercept the API call.
- Don't double up `page.waitForURL(/x/)` followed by `expect(page).toHaveURL(/x/)` — the `expect` already auto-retries. Pick one.

---

## 7. Coverage

Run `npm run test:coverage` to generate an HTML coverage report.

The minimum thresholds enforced in CI:

| Metric | Minimum |
|---|---|
| Lines | 80% |
| Functions | 80% |
| Branches | 80% |
| Statements | 80% |

Coverage is measured over: `lib/`, `app/api/`, `app/actions.ts`, `store/`, `hooks/`, `services/`.

If your PR drops any metric below 80%, CI will fail. Add unit or integration tests for any new code you write in those directories.

---

## 8. CI Pipeline

Tests run automatically on every push via GitHub Actions (`.github/workflows/ci.yml`):

```
Lint & Type Check  ──┐
                     │
Unit + Integration ──┤── (must pass) ──► E2E Smoke Tests
     (with coverage) │
                     ┘
```

- E2E only runs `@smoke` tests in CI (faster feedback loop)
- Full `@regression` and `@a11y` suites are run manually or on release branches
- On failure, Playwright uploads a report artifact with screenshots and traces

---

## 9. Common Mistakes to Avoid

**Don't skip `cleanDb()`.** If you forget it, test data from a previous run leaks into your test and causes flaky failures that are hard to trace.

**Don't hardcode DB IDs.** IDs auto-increment and differ between runs. Always use factory return values.

**Don't mock the database.** Integration tests intentionally hit a real DB. Mocking Prisma would hide real bugs (it happened before — see `db-setup.ts` comments).

**Don't use `.only()` in test files before committing.** Playwright is configured with `forbidOnly: true` in CI — your PR will fail.

**Don't write UI assertions in integration tests.** Integration tests call route handlers directly (`GET(req)`) — they return JSON responses, not HTML. Save UI assertions for E2E.

**Don't `sleep()` in E2E tests.** Use `await expect(locator).toBeVisible()` or `page.waitForResponse()` instead — Playwright retries automatically. Hard sleeps make tests slow and still flaky.

---

## 10. Cheat Sheet

| Task | Command |
|---|---|
| Run all tests | `npm run test` |
| Run unit tests only | `npm run test:unit` |
| Run integration tests | `npm run test:integration` |
| Run E2E smoke tests | `npm run test:e2e:smoke` |
| Run E2E with UI debugger | `npm run test:e2e:ui` |
| See coverage report | `npm run test:coverage` |
| Start test DB | `npm run test:db:up` |
| Stop test DB | `npm run test:db:down` |
| Wipe and re-seed dev DB | `npm run prisma:reset` |
| Open Prisma Studio (dev DB) | `npm run prisma:studio` |
