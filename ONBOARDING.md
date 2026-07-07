# Onboarding Guide — Pizza Ordering App

A step-by-step walkthrough of how the app works for new contributors. Each section explains what the user sees, which code runs, and how the pieces connect.

---

## 1. Landing on the Home Page

**What the user sees:**
- A header with logo, search bar, and cart button
- A horizontal category nav bar (Pizzas, Combos, etc.)
- A sidebar with filters (pizza type, size, price range, ingredients)
- A grid of pizza cards grouped by category

**How it works:**

`app/(root)/page.tsx` is a **Server Component**. It reads URL query parameters (filters, pagination, sort), calls `findPizzas()` (`lib/find-pizzas.ts`), and passes the result to `<ProductsGroupList>`.

`findPizzas()` is pure orchestration over a **`PizzaRepository`** interface (`lib/repositories/pizza-repository.ts`); the live wiring uses `PrismaPizzaRepository`. The repository is the only thing that touches Prisma, so unit tests can pass an in-memory stub and exercise the parsing/sorting/orchestration logic without spinning up the test DB. All filter logic still runs server-side:
- `sizes`, `pizzaTypes`, `ingredients` → filter by inclusion
- `priceFrom / priceTo` → filter by minimum product variant price
- `query` → case-insensitive name match
- Results paginated (default 12 per page)

The `<Categories>` and `<TopBar>` components (`components/shared/`) render the category nav. They read category data passed from the server and track the active category via **Zustand** (`store/category.ts`).

---

## 2. Browsing & Filtering

**What the user does:**
- Clicks category tabs → page scrolls to that section
- Adjusts filters in the sidebar → URL updates, page re-renders with new products

**How it works:**

**Category nav active state** — `<ProductsGroupList>` (`components/shared/products-group-list.tsx`) attaches an `IntersectionObserver` to each category section. As sections scroll into view, it calls `useCategoryStore.setActiveId()`. Clicking a nav link locks the store for 1 second (prevents the observer overriding the click). The `<Categories>` component resets to the first category when `scrollY < 100`.

**Filters** — `<Filters>` (`components/shared/filters.tsx`) is a client component. When the user changes any filter, it calls `qs.stringify()` to build a query string and updates the URL with `router.push()`. Debounced 300ms. Next.js re-renders the server page with the new params.

**Mobile** — `<MobileFilters>` wraps the same filter UI in a Radix UI `<Sheet>` (drawer).

---

## 3. Searching for a Product

**What the user does:**
- Types in the search bar in the header
- Up to 5 results appear in a dropdown; arrow keys navigate, Enter navigates, Escape closes

**How it works:**

`<SearchInput>` (`components/shared/search-input.tsx`) debounces the input and calls `GET /api/products/search?query=...`. The API route (`app/api/products/search/route.ts`) runs a Prisma `findMany` with a case-insensitive name filter, capped at 5 results.

---

## 4. Viewing a Product

**What the user does:**
- Clicks a product card
- A modal pops up (instead of navigating away) with size/crust selectors, ingredient checkboxes, and a price that updates in real time

**How it works — intercepted routes:**

Next.js has a **parallel route** at `app/(root)/@modal/(.)product/[id]/page.tsx`. When clicking from the home page, Next.js intercepts the navigation and renders this modal route instead of the full page.

The full page at `app/(root)/product/[id]/page.tsx` is used for direct URL access (e.g., shared link, page refresh).

Inside the modal, `<ChoosePizzaForm>` (`components/shared/choose-pizza-form.tsx`) manages:
- **Size selector** — 20 / 30 / 40 cm buttons
- **Crust selector** — Thin / Traditional buttons
- **Ingredient checkboxes** — each ingredient has a price adder
- Price recalculates client-side: `base price of selected variant + sum of selected ingredient prices`

The available variants (`ProductItem[]`) come from the DB — each is a unique size × crust combination with its own price.

---

## 5. Adding an Item to the Cart

**What the user does:**
- Clicks "Add to cart" inside the modal or product page

**How it works:**

The cart button calls `useCartStore.addCartItem()` (`store/cart.ts`). This Zustand action posts to `POST /api/cart` with `{ productItemId, ingredients[] }`.

The API route (`app/api/cart/route.ts`):
1. Reads the cart token cookie (`cartToken`); creates one if absent
2. Finds or creates a `Cart` record in the DB keyed by `tokenId` (anonymous) or `userId` (logged in)
3. Checks if the same item+ingredients combo already exists → increments quantity; else creates new `CartItem`
4. Recalculates `cart.totalAmount`
5. Returns the updated cart

The header cart button shows a badge with `totalAmount`. The **cart drawer** (`<CartDrawer>`) opens as a side sheet.

---

## 6. Managing the Cart

**What the user does:**
- Opens the cart drawer from the header
- Adjusts quantities with + / − buttons
- Removes items with the × button
- Clicks "Proceed to checkout" → navigates to `/cart`

**How it works:**

`useCartStore` (`store/cart.ts`) holds `items[]` and `totalAmount`. On mount it calls `GET /api/cart` to hydrate from the server.

Quantity changes call `PATCH /api/cart/[id]` (debounced 200ms). Removals call `DELETE /api/cart/[id]`. Both routes recalculate `totalAmount` and return the updated cart.

**Anonymous vs. logged-in:** The cart is stored in the DB in both cases. Anonymous carts use a `tokenId` from the cookie; logged-in carts use `userId`. On checkout the user must be signed in (the server action checks for a session).

---

## 7. Signing In / Registering

**What the user does:**
- Clicks the auth button in the header
- A dialog opens with Login / Register tabs
- Can sign in with email+password, GitHub, or Google

**How it works:**

Auth is handled by **NextAuth v5** (`lib/auth-options.ts`). Three providers: Credentials, GitHub, Google.

- **Register** — Server action hashes the password with bcrypt (10 rounds), creates a `User` record, and sends a verification email.
- **Login** — Credentials provider fetches the user by email, compares bcrypt hash, returns the user object. The `jwt` callback adds `id` and `role` to the token; the `session` callback exposes them to the client.
- **OAuth** — NextAuth handles the redirect dance; on first login it creates a `User` record.

Session is stored in a cookie. `getServerSession(authOptions)` (or `lib/get-user-session.ts`) is used anywhere server-side auth is needed.

---

## 8. Placing an Order

**What the user does:**
- On `/cart`, fills in personal info (name, email, phone) and delivery address
- Clicks "Proceed to payment"
- Gets redirected to Stripe checkout

**How it works:**

The form on `/cart` has three visual steps (cart review → personal info → delivery). The submit button calls the `createOrder()` **Server Action** (`app/actions.ts`):

1. Validates form with Zod schema
2. Checks `getServerSession()` — if not logged in, redirects to `/not-auth`
3. Fetches the user's cart from DB (matches by `userId` or `tokenId`)
4. Creates an `Order` record with status `PENDING`; stores items as a **JSON snapshot** (so order history is immutable even if products change later)
5. Clears all `CartItem` rows; resets `cart.totalAmount` to 0
6. Calls `createPayment()` → Stripe creates a checkout session and returns a URL
7. Updates the order with `paymentId`
8. Sends a confirmation email with the Stripe payment link (via Resend)
9. Redirects the user to the Stripe URL

---

## 9. Payment Webhook & Order Confirmation

**What happens in the background:**

After the user pays on Stripe, Stripe calls `POST /api/cart/checkout/callback`.

The webhook handler:
1. Verifies the Stripe signature
2. On `checkout.session.completed` event, finds the order by `paymentId`
3. Updates `order.status` → `SUCCEEDED`
4. Sends a success email with the full order itemized list

The user can view their order history at `/orders` (requires login). Each `<OrderItem>` card shows items, date, total, and status badge.

---

## 10. Admin Dashboard

**Who can access it:** Users with `role: ADMIN` only. Any other role hitting `/dashboard/*` is redirected to home.

**What admins can do:**

| Route | Purpose |
|---|---|
| `/dashboard/users` | View / create / edit / delete user accounts |
| `/dashboard/products` | Manage the menu (create pizzas, assign category, upload image) |
| `/dashboard/categories` | Manage pizza categories shown in the nav |
| `/dashboard/ingredients` | Manage extra toppings (name, image, price) |
| `/dashboard/product-items` | Manage product variants (size × crust × price per product) |
| `/dashboard/orders` | View all customer orders with status; delete orders via the shared `<DeleteButton>` (destructive variant) |

All dashboard forms use **React Hook Form + Zod** for validation. Mutations go through **Server Actions** in `app/actions.ts`, which call Prisma directly and then call `revalidatePath()` to invalidate the Next.js cache.

File uploads (product/ingredient images) go through **UploadThing** (`app/api/uploadthing/`).

---

## Key Concepts Cheat Sheet

| Concept | Where to look |
|---|---|
| Server-side data fetching | `app/**/page.tsx` (Server Components) |
| Client global state | `store/cart.ts`, `store/category.ts` (Zustand) |
| REST API calls from stores | `services/` (typed Axios wrappers) |
| Mutations from forms/UI | `app/actions.ts` (Server Actions) |
| Database queries | `app/api/**/route.ts`, `app/actions.ts` (Prisma directly); `lib/find-pizzas.ts` for the catalog (delegates to a repository) |
| Repository abstraction | `lib/repositories/` — narrow interface in front of Prisma so callers can be unit-tested without the DB (`PizzaRepository` today; `CartRepository` next) |
| Auth config | `lib/auth-options.ts` |
| Product modal (intercepted route) | `app/(root)/@modal/(.)product/[id]/page.tsx` |
| Stripe + email on order | `app/actions.ts` → `createOrder()` |
| Stripe webhook | `app/api/cart/checkout/callback/route.ts` |
| Price minimum rule on cards | `lib/find-pizzas.ts` — `items[0].price` (ordered asc) |
